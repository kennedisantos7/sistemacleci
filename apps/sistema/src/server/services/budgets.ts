import {
  prisma,
  BudgetStatus,
  BudgetDocType,
  AdjustmentMode,
  PriceUnit,
  SaleOrigin,
  SaleStatus,
  type Prisma,
  type Role,
} from "@cleci/db";
import { z } from "zod";
import { markSalePaid } from "./sales";
import { getPriceItemsByIds } from "./price-items";
import { canSeeAllBudgets, isDesigner } from "@/lib/rbac";
import { resolverDocType, podeConverterEmPedido } from "@/lib/doc-type";
import { touchClientActivity } from "./clients";
import {
  calcBudget,
  type Adjustment,
  type BudgetAdjustments,
  type BudgetUnit,
} from "@/lib/budget-math";

// ---------------------------------------------------------------------------
// Escopo por papel
// ---------------------------------------------------------------------------
// Admin/desenvolvedor/gerente enxergam os orçamentos de toda a equipe; o
// vendedor só os próprios. Todo acesso passa por aqui — nunca só pela UI.

export type BudgetActor = { id: string; role: Role; name?: string | null; email?: string };

function scopeWhere(actor: BudgetActor): Prisma.BudgetWhereInput {
  if (canSeeAllBudgets(actor.role)) return {};
  // O design abre o orçamento inteiro (é o que ele precisa para fazer a arte),
  // mas só os que foram enviados para o design. Orçamento que nunca entrou no
  // fluxo é invisível para ele.
  if (isDesigner(actor.role)) return { designStatus: { not: null } };
  return { vendedorId: actor.id };
}

function clientScopeWhere(actor: BudgetActor): Prisma.ClientWhereInput {
  return canSeeAllBudgets(actor.role) ? {} : { vendedorId: actor.id };
}

// ---------------------------------------------------------------------------
// Validação (o formulário envia os itens como JSON)
// ---------------------------------------------------------------------------

const decimalString = z
  .number()
  .nonnegative()
  .max(10_000)
  .transform((n) => Math.round(n * 1000) / 1000);

export const budgetItemsSchema = z
  .array(
    z
      .object({
        priceItemId: z.string().cuid().nullable().optional(),
        description: z.string().trim().min(1, "Descreva o item.").max(500),
        unit: z.nativeEnum(PriceUnit).default(PriceUnit.UNIDADE),
        widthM: decimalString.nullable().optional(),
        lengthM: decimalString.nullable().optional(),
        quantity: z.number().positive("Quantidade inválida.").max(100_000),
        unitPriceCents: z.number().int().min(0).max(100_000_000),
      })
      .superRefine((item, ctx) => {
        // Itens por m² precisam das duas medidas — senão o total sai zerado
        // sem o vendedor perceber.
        if (item.unit !== PriceUnit.M2) return;
        if (!item.widthM || !item.lengthM) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `"${item.description}": informe largura e comprimento (item cobrado por m²).`,
          });
        }
      }),
  )
  .min(1, "Adicione ao menos um item.")
  .max(200); // itens ilimitados na prática; teto só para barrar abuso

export type BudgetItemInput = z.infer<typeof budgetItemsSchema>[number];

const adjustmentSchema = z.object({
  mode: z.nativeEnum(AdjustmentMode).default(AdjustmentMode.VALOR),
  // centavos quando VALOR, bps quando PERCENTUAL (10000 bps = 100%)
  input: z.number().int().min(0).max(100_000_000).default(0),
});

export const budgetAdjustmentsSchema = z.object({
  discount: adjustmentSchema,
  surcharge: adjustmentSchema,
  freight: adjustmentSchema,
  tax: adjustmentSchema,
});

export type BudgetAdjustmentsInput = z.infer<typeof budgetAdjustmentsSchema>;

export const ZERO_ADJUSTMENTS: BudgetAdjustmentsInput = {
  discount: { mode: AdjustmentMode.VALOR, input: 0 },
  surcharge: { mode: AdjustmentMode.VALOR, input: 0 },
  freight: { mode: AdjustmentMode.VALOR, input: 0 },
  tax: { mode: AdjustmentMode.VALOR, input: 0 },
};

export type BudgetHeaderInput = {
  clientId: string;
  docType: BudgetDocType;
  title?: string | null;
  note?: string | null;
  validUntil?: Date | null;
  paymentTerms?: string | null;
  deliveryForecast?: string | null;
  deliveryCity?: string | null;
};

// ---------------------------------------------------------------------------
// Cálculo (fonte da verdade)
// ---------------------------------------------------------------------------

function toAdjustment(input: { mode: AdjustmentMode; input: number }): Adjustment {
  return { mode: input.mode === AdjustmentMode.PERCENTUAL ? "PERCENTUAL" : "VALOR", input: input.input };
}

function toAdjustments(input: BudgetAdjustmentsInput): BudgetAdjustments {
  return {
    discount: toAdjustment(input.discount),
    surcharge: toAdjustment(input.surcharge),
    freight: toAdjustment(input.freight),
    tax: toAdjustment(input.tax),
  };
}

/**
 * Recalcula tudo no servidor. O preço e a descrição podem ser ajustados pelo
 * vendedor (a planilha permite), mas o `code` vem sempre da tabela de preços —
 * o cliente não escolhe que código gravar.
 */
export async function buildBudgetData(
  items: BudgetItemInput[],
  adjustments: BudgetAdjustmentsInput,
) {
  const priceItemIds = items.map((i) => i.priceItemId).filter((id): id is string => Boolean(id));
  const priceItems = await getPriceItemsByIds(priceItemIds);

  // Um produto apagado entre abrir e salvar o formulário vira item avulso.
  const linked = items.map((item) => {
    const priceItem = item.priceItemId ? priceItems.get(item.priceItemId) : undefined;
    return { item, priceItem };
  });

  const { items: calculated, totals } = calcBudget(
    linked.map(({ item }) => ({
      unit: item.unit as BudgetUnit,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      widthM: item.widthM ?? null,
      lengthM: item.lengthM ?? null,
    })),
    toAdjustments(adjustments),
  );

  const rows = linked.map(({ item, priceItem }, index) => {
    const calc = calculated[index]!;
    const isM2 = item.unit === PriceUnit.M2;
    return {
      position: index,
      priceItemId: priceItem?.id ?? null,
      code: priceItem?.code ?? null,
      description: item.description,
      unit: item.unit,
      widthM: isM2 ? (item.widthM ?? null) : null,
      lengthM: isM2 ? (item.lengthM ?? null) : null,
      areaM2: calc.areaM2,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      partialCents: calc.partialCents,
      totalCents: calc.totalCents,
    };
  });

  return {
    items: rows,
    totals: {
      subtotalCents: totals.subtotalCents,
      totalCents: totals.totalCents,
      discountMode: adjustments.discount.mode,
      discountInput: adjustments.discount.input,
      discountCents: totals.discountCents,
      surchargeMode: adjustments.surcharge.mode,
      surchargeInput: adjustments.surcharge.input,
      surchargeCents: totals.surchargeCents,
      freightMode: adjustments.freight.mode,
      freightInput: adjustments.freight.input,
      freightCents: totals.freightCents,
      taxMode: adjustments.tax.mode,
      taxInput: adjustments.tax.input,
      taxCents: totals.taxCents,
    },
  };
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

const BUDGET_INCLUDE = {
  client: true,
  items: { orderBy: { position: "asc" } },
  vendedor: { select: { id: true, name: true, email: true } },
  sale: { select: { id: true, status: true, paidAt: true } },
} satisfies Prisma.BudgetInclude;

/** Busca um orçamento respeitando o escopo do papel. */
export function getBudgetForActor(actor: BudgetActor, budgetId: string) {
  return prisma.budget.findFirst({
    where: { id: budgetId, ...scopeWhere(actor) },
    include: BUDGET_INCLUDE,
  });
}

/** Lista os orçamentos visíveis para o papel. */
export function listBudgetsForActor(
  actor: BudgetActor,
  options: {
    status?: BudgetStatus;
    /** Orçamento e pedido têm seções separadas; sem filtro, lista os dois. */
    docType?: BudgetDocType;
    search?: string;
    take?: number;
  } = {},
) {
  const { status, docType, search, take = 100 } = options;
  return prisma.budget.findMany({
    where: {
      ...scopeWhere(actor),
      ...(status ? { status } : {}),
      ...(docType ? { docType } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { client: { name: { contains: search, mode: "insensitive" } } },
              { client: { companyName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      client: { select: { id: true, name: true, companyName: true } },
      vendedor: { select: { id: true, name: true, email: true } },
      sale: { select: { id: true, status: true } },
      _count: { select: { items: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

/**
 * O cliente precisa estar no escopo de quem está montando o orçamento — ou
 * seja, ser titular dele (ou equipe administrativa). Empresa de outro vendedor,
 * ou sem titular, precisa ser assumida antes.
 */
async function assertClientInScope(actor: BudgetActor, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, ...clientScopeWhere(actor) },
    select: { id: true },
  });
  if (!client) throw new Error("Cliente inválido ou em atendimento por outro vendedor.");
}

/** Orçamento é trabalho: entra no histórico e renova o prazo do titular. */
function registrarNoCliente(actor: BudgetActor, clientId: string, descricao: string) {
  return touchClientActivity(
    clientId,
    actor.id,
    descricao,
    actor.name?.trim() || actor.email || "Usuário",
  );
}

export async function createBudget(
  actor: BudgetActor,
  header: BudgetHeaderInput,
  items: BudgetItemInput[],
  adjustments: BudgetAdjustmentsInput,
) {
  await assertClientInScope(actor, header.clientId);
  const data = await buildBudgetData(items, adjustments);

  const budget = await prisma.budget.create({
    data: {
      vendedorId: actor.id,
      clientId: header.clientId,
      docType: header.docType,
      title: header.title ?? null,
      note: header.note ?? null,
      validUntil: header.validUntil ?? null,
      paymentTerms: header.paymentTerms ?? null,
      deliveryForecast: header.deliveryForecast ?? null,
      deliveryCity: header.deliveryCity ?? null,
      ...data.totals,
      items: { create: data.items },
    },
  });

  const rotulo = budget.docType === BudgetDocType.PEDIDO ? "Pedido" : "Orçamento";
  await registrarNoCliente(actor, header.clientId, `${rotulo} #${budget.number} criado.`);
  return budget;
}

/** Atualiza um orçamento — somente enquanto RASCUNHO (imutável após envio). */
export async function updateBudget(
  actor: BudgetActor,
  budgetId: string,
  header: BudgetHeaderInput,
  items: BudgetItemInput[],
  adjustments: BudgetAdjustmentsInput,
) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, status: BudgetStatus.RASCUNHO, ...scopeWhere(actor) },
    select: { id: true, docType: true },
  });
  if (!budget) throw new Error("Orçamento não encontrado ou já enviado (não editável).");

  // Pedido não volta a ser orçamento. O formulário já trava o campo, mas a
  // regra tem de valer aqui: uma requisição forjada não rebaixa o documento.
  const docType = resolverDocType(budget.docType, header.docType);

  await assertClientInScope(actor, header.clientId);
  const data = await buildBudgetData(items, adjustments);

  const atualizado = await prisma.$transaction(async (tx) => {
    await tx.budgetItem.deleteMany({ where: { budgetId } });
    return tx.budget.update({
      where: { id: budgetId },
      data: {
        clientId: header.clientId,
        docType,
        title: header.title ?? null,
        note: header.note ?? null,
        validUntil: header.validUntil ?? null,
        paymentTerms: header.paymentTerms ?? null,
        deliveryForecast: header.deliveryForecast ?? null,
        deliveryCity: header.deliveryCity ?? null,
        ...data.totals,
        items: { create: data.items },
      },
    });
  });

  const rotulo = atualizado.docType === BudgetDocType.PEDIDO ? "Pedido" : "Orçamento";
  await registrarNoCliente(actor, header.clientId, `${rotulo} #${atualizado.number} atualizado.`);
  return atualizado;
}

/**
 * Converte um orçamento em pedido. Caminho de mão única: pedido NÃO volta a
 * ser orçamento — o pedido é o documento que fecha a venda, com cláusulas e
 * assinatura, e desfazer isso reescreveria o que o cliente já recebeu.
 *
 * A regra também está em `updateBudget`, que ignora a tentativa de rebaixar o
 * tipo pelo formulário. Aqui é o caminho explícito.
 */
export async function convertToPedido(actor: BudgetActor, budgetId: string) {
  const atual = await prisma.budget.findFirst({
    where: { id: budgetId, ...scopeWhere(actor) },
    select: { docType: true },
  });
  if (!atual) throw new Error("Orçamento não encontrado.");
  if (!podeConverterEmPedido(atual.docType)) throw new Error("Este documento já é um pedido.");

  const res = await prisma.budget.updateMany({
    where: { id: budgetId, docType: BudgetDocType.ORCAMENTO, ...scopeWhere(actor) },
    data: { docType: BudgetDocType.PEDIDO },
  });
  if (res.count === 0) {
    throw new Error("Orçamento não encontrado ou já convertido em pedido.");
  }
}

/** Exclui um orçamento em rascunho (nunca um já enviado/aceito). */
export async function deleteBudget(actor: BudgetActor, budgetId: string) {
  const res = await prisma.budget.deleteMany({
    where: { id: budgetId, status: BudgetStatus.RASCUNHO, saleId: null, ...scopeWhere(actor) },
  });
  if (res.count === 0) throw new Error("Só rascunhos podem ser excluídos.");
}

// ---------------------------------------------------------------------------
// Transições de status
// ---------------------------------------------------------------------------

/** RASCUNHO -> ENVIADO. */
export async function markBudgetSent(actor: BudgetActor, budgetId: string) {
  const res = await prisma.budget.updateMany({
    where: { id: budgetId, status: BudgetStatus.RASCUNHO, ...scopeWhere(actor) },
    data: { status: BudgetStatus.ENVIADO, sentAt: new Date() },
  });
  if (res.count === 0) throw new Error("Orçamento não está em rascunho.");
}

/** ENVIADO -> RASCUNHO (corrigir antes de reenviar). Só sem venda vinculada. */
export async function revertBudgetToDraft(actor: BudgetActor, budgetId: string) {
  const res = await prisma.budget.updateMany({
    where: { id: budgetId, status: BudgetStatus.ENVIADO, saleId: null, ...scopeWhere(actor) },
    data: { status: BudgetStatus.RASCUNHO, sentAt: null },
  });
  if (res.count === 0) throw new Error("Orçamento não pode voltar para rascunho.");
}

/**
 * ENVIADO -> ACEITO. Cria a venda correspondente (origin ORCAMENTO, status
 * PENDENTE — "aceito" significa aprovação do cliente, não dinheiro em caixa).
 * A venda fica no nome do vendedor dono do orçamento, não de quem clicou.
 * Idempotente: recusa se já existe venda vinculada.
 */
export async function markBudgetAccepted(actor: BudgetActor, budgetId: string) {
  return prisma.$transaction(async (tx) => {
    const budget = await tx.budget.findFirst({
      where: {
        id: budgetId,
        status: BudgetStatus.ENVIADO,
        saleId: null,
        ...scopeWhere(actor),
      },
      include: { client: { select: { name: true, email: true } } },
    });
    if (!budget) throw new Error("Orçamento não pode ser aceito neste estado.");

    // VENDEDOR_FIXO não gera comissão (regra em createCommissionForSale).
    const sale = await tx.sale.create({
      data: {
        origin: SaleOrigin.ORCAMENTO,
        gateway: null,
        status: SaleStatus.PENDENTE,
        amountCents: budget.totalCents,
        currency: "BRL",
        customerName: budget.client.name,
        customerEmail: budget.client.email,
        note: `${budget.docType === BudgetDocType.PEDIDO ? "Pedido" : "Orçamento"} #${budget.number}`,
        userId: budget.vendedorId,
      },
    });

    await tx.budget.update({
      where: { id: budgetId },
      data: { status: BudgetStatus.ACEITO, respondedAt: new Date(), saleId: sale.id },
    });

    return sale;
  });
}

/** ENVIADO -> RECUSADO. Não gera venda. */
export async function markBudgetRejected(actor: BudgetActor, budgetId: string) {
  const res = await prisma.budget.updateMany({
    where: { id: budgetId, status: BudgetStatus.ENVIADO, ...scopeWhere(actor) },
    data: { status: BudgetStatus.RECUSADO, respondedAt: new Date() },
  });
  if (res.count === 0) throw new Error("Orçamento não pode ser recusado neste estado.");
}

/** Marca a venda do orçamento aceito como finalizada (paga). */
export async function markBudgetSaleFinalized(actor: BudgetActor, budgetId: string) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, status: BudgetStatus.ACEITO, ...scopeWhere(actor) },
    include: { sale: true },
  });
  if (!budget?.sale) throw new Error("Orçamento não tem venda vinculada.");
  if (budget.sale.status !== SaleStatus.PENDENTE) return; // já finalizada/tratada

  await markSalePaid(budget.sale);
}

/** Um orçamento em aberto com validade vencida (selo "vencido" na tela). */
export function isBudgetOverdue(budget: { status: BudgetStatus; validUntil: Date | null }): boolean {
  return (
    budget.validUntil !== null &&
    budget.validUntil < new Date() &&
    (budget.status === BudgetStatus.RASCUNHO || budget.status === BudgetStatus.ENVIADO)
  );
}
