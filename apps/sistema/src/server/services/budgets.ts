import { prisma, BudgetStatus, SaleOrigin, SaleStatus } from "@cleci/db";
import { z } from "zod";
import { markSalePaid } from "./sales";

// ---------------------------------------------------------------------------
// Validação dos itens (enviados pelo formulário como JSON).
// ---------------------------------------------------------------------------
export const budgetItemsSchema = z
  .array(
    z.object({
      description: z.string().trim().min(1, "Descreva o item.").max(500),
      quantity: z.number().positive("Quantidade inválida.").max(100_000),
      unitPriceCents: z.number().int().min(0).max(100_000_000),
    }),
  )
  .min(1, "Adicione ao menos um item.")
  .max(50);

export type BudgetItemInput = z.infer<typeof budgetItemsSchema>[number];

export type BudgetHeaderInput = {
  clientId: string;
  title?: string | null;
  note?: string | null;
  validUntil?: Date | null;
};

/** Recalcula totais no servidor (nunca confia no total vindo do cliente). */
export function recalculateTotals(items: BudgetItemInput[]) {
  const withTotals = items.map((item, index) => {
    const quantity = Math.round(item.quantity * 100) / 100;
    return {
      position: index,
      description: item.description,
      quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: Math.round(quantity * item.unitPriceCents),
    };
  });
  const subtotalCents = withTotals.reduce((sum, item) => sum + item.totalCents, 0);
  return { items: withTotals, subtotalCents, totalCents: subtotalCents };
}

/** Busca um orçamento garantindo que pertence ao vendedor. */
export function getBudgetForVendedor(vendedorId: string, budgetId: string) {
  return prisma.budget.findFirst({
    where: { id: budgetId, vendedorId },
    include: {
      client: true,
      items: { orderBy: { position: "asc" } },
      sale: { select: { id: true, status: true, paidAt: true } },
    },
  });
}

export async function createBudget(
  vendedorId: string,
  header: BudgetHeaderInput,
  items: BudgetItemInput[],
) {
  // O cliente do orçamento precisa pertencer ao vendedor.
  const client = await prisma.client.findFirst({
    where: { id: header.clientId, vendedorId },
    select: { id: true },
  });
  if (!client) throw new Error("Cliente inválido.");

  const totals = recalculateTotals(items);

  return prisma.budget.create({
    data: {
      vendedorId,
      clientId: header.clientId,
      title: header.title ?? null,
      note: header.note ?? null,
      validUntil: header.validUntil ?? null,
      subtotalCents: totals.subtotalCents,
      totalCents: totals.totalCents,
      items: { create: totals.items },
    },
  });
}

/** Atualiza um orçamento — somente enquanto RASCUNHO (imutável após envio). */
export async function updateBudget(
  vendedorId: string,
  budgetId: string,
  header: BudgetHeaderInput,
  items: BudgetItemInput[],
) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, vendedorId, status: BudgetStatus.RASCUNHO },
    select: { id: true },
  });
  if (!budget) throw new Error("Orçamento não encontrado ou já enviado (não editável).");

  const client = await prisma.client.findFirst({
    where: { id: header.clientId, vendedorId },
    select: { id: true },
  });
  if (!client) throw new Error("Cliente inválido.");

  const totals = recalculateTotals(items);

  return prisma.$transaction(async (tx) => {
    await tx.budgetItem.deleteMany({ where: { budgetId } });
    return tx.budget.update({
      where: { id: budgetId },
      data: {
        clientId: header.clientId,
        title: header.title ?? null,
        note: header.note ?? null,
        validUntil: header.validUntil ?? null,
        subtotalCents: totals.subtotalCents,
        totalCents: totals.totalCents,
        items: { create: totals.items },
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Transições de status
// ---------------------------------------------------------------------------

/** RASCUNHO -> ENVIADO. */
export async function markBudgetSent(vendedorId: string, budgetId: string) {
  const res = await prisma.budget.updateMany({
    where: { id: budgetId, vendedorId, status: BudgetStatus.RASCUNHO },
    data: { status: BudgetStatus.ENVIADO, sentAt: new Date() },
  });
  if (res.count === 0) throw new Error("Orçamento não está em rascunho.");
}

/** ENVIADO -> RASCUNHO (corrigir antes de reenviar). Só sem venda vinculada. */
export async function revertBudgetToDraft(vendedorId: string, budgetId: string) {
  const res = await prisma.budget.updateMany({
    where: { id: budgetId, vendedorId, status: BudgetStatus.ENVIADO, saleId: null },
    data: { status: BudgetStatus.RASCUNHO, sentAt: null },
  });
  if (res.count === 0) throw new Error("Orçamento não pode voltar para rascunho.");
}

/**
 * ENVIADO -> ACEITO. Cria a venda correspondente (origin ORCAMENTO, status
 * PENDENTE — "aceito" significa aprovação do cliente, não dinheiro em caixa).
 * Idempotente: recusa se já existe venda vinculada.
 */
export async function markBudgetAccepted(vendedorId: string, budgetId: string) {
  return prisma.$transaction(async (tx) => {
    const budget = await tx.budget.findFirst({
      where: { id: budgetId, vendedorId, status: BudgetStatus.ENVIADO, saleId: null },
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
        note: `Orçamento #${budget.number}`,
        userId: vendedorId,
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
export async function markBudgetRejected(vendedorId: string, budgetId: string) {
  const res = await prisma.budget.updateMany({
    where: { id: budgetId, vendedorId, status: BudgetStatus.ENVIADO },
    data: { status: BudgetStatus.RECUSADO, respondedAt: new Date() },
  });
  if (res.count === 0) throw new Error("Orçamento não pode ser recusado neste estado.");
}

/** Marca a venda do orçamento aceito como finalizada (paga). */
export async function markBudgetSaleFinalized(vendedorId: string, budgetId: string) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, vendedorId, status: BudgetStatus.ACEITO },
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
