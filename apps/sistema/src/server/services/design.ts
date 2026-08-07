import { prisma, DesignStatus, type Prisma } from "@cleci/db";
import { z } from "zod";
import { isStaff, isDesigner } from "@/lib/rbac";
import {
  podeSolicitar,
  podeCancelar,
  podeAssumir,
  podeAnexarArte,
  podeEntregar,
  podePedirRevisao,
  podeAprovarArte,
  podeVerDesign,
  ETAPAS_ABERTAS,
  type DesignActor,
  type DesignSubject,
} from "@/lib/design-flow";
import { touchClientActivity } from "./clients";

export type { DesignActor };

/** Limite do arquivo. Baixo de propósito: a arte vai no próprio banco. */
export const MAX_ARTE_BYTES = 4 * 1024 * 1024;

export const TIPOS_ARTE = ["image/png", "image/jpeg", "image/webp"] as const;

export const briefSchema = z.string().trim().max(2000).optional();

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

/**
 * Monta o objeto que a máquina de estados entende. `data` da arte NUNCA entra
 * aqui — são megabytes por linha.
 */
const SUBJECT_SELECT = {
  id: true,
  vendedorId: true,
  status: true,
  designStatus: true,
  designerId: true,
  sale: { select: { status: true } },
  _count: { select: { arts: true } },
} satisfies Prisma.BudgetSelect;

type SubjectRow = Prisma.BudgetGetPayload<{ select: typeof SUBJECT_SELECT }>;

function toSubject(b: SubjectRow): DesignSubject {
  return {
    vendedorId: b.vendedorId,
    designStatus: b.designStatus,
    designerId: b.designerId,
    saleStatus: b.sale?.status ?? null,
    budgetStatus: b.status,
    artCount: b._count.arts,
  };
}

async function carregar(budgetId: string): Promise<{ row: SubjectRow; s: DesignSubject } | null> {
  const row = await prisma.budget.findUnique({ where: { id: budgetId }, select: SUBJECT_SELECT });
  return row ? { row, s: toSubject(row) } : null;
}

/** Estado do design + o que o ator pode fazer agora. Null = sem permissão. */
export async function getDesignPanel(actor: DesignActor, budgetId: string) {
  const carregado = await carregar(budgetId);
  if (!carregado) return null;
  const { s } = carregado;
  if (!podeVerDesign(actor, s)) return null;

  const [arts, budget] = await Promise.all([
    // Sem `data`: a imagem é servida pela rota /arte/[artId].
    prisma.budgetArt.findMany({
      where: { budgetId },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        current: true,
        mimeType: true,
        sizeBytes: true,
        widthPx: true,
        heightPx: true,
        createdAt: true,
        uploadedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.budget.findUnique({
      where: { id: budgetId },
      select: {
        designStatus: true,
        designBrief: true,
        designerNote: true,
        designRequestedAt: true,
        designDeliveredAt: true,
        designRequestedBy: { select: { name: true, email: true } },
        designer: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    ...budget!,
    arts,
    acoes: {
      solicitar: podeSolicitar(actor, s),
      cancelar: podeCancelar(actor, s),
      assumir: podeAssumir(actor, s),
      anexar: podeAnexarArte(actor, s),
      entregar: podeEntregar(actor, s),
      revisar: podePedirRevisao(actor, s),
      aprovar: podeAprovarArte(actor, s),
    },
  };
}

export type DesignPanel = NonNullable<Awaited<ReturnType<typeof getDesignPanel>>>;

/**
 * Fila do design. O designer vê tudo que entrou no fluxo; a equipe
 * administrativa também. Vendedor não usa esta tela.
 */
export async function listDesignQueue(
  actor: DesignActor,
  filtro: "abertos" | "meus" | "entregues" | "todos" = "abertos",
) {
  if (!isDesigner(actor.role) && !isStaff(actor.role)) return [];

  const where: Prisma.BudgetWhereInput = {
    designStatus: { not: null },
    ...(filtro === "abertos" ? { designStatus: { in: ETAPAS_ABERTAS } } : {}),
    ...(filtro === "meus" ? { designerId: actor.id } : {}),
    ...(filtro === "entregues"
      ? { designStatus: { in: [DesignStatus.ENTREGUE, DesignStatus.APROVADA] } }
      : {}),
  };

  return prisma.budget.findMany({
    where,
    // Mais antigo primeiro: quem pediu antes é atendido antes.
    orderBy: [{ designRequestedAt: "asc" }],
    take: 100,
    select: {
      id: true,
      number: true,
      title: true,
      docType: true,
      status: true,
      designStatus: true,
      designBrief: true,
      designRequestedAt: true,
      client: { select: { name: true, companyName: true } },
      vendedor: { select: { name: true, email: true } },
      designer: { select: { id: true, name: true, email: true } },
      _count: { select: { arts: true, items: true } },
    },
  });
}

/** Contagem por etapa, para os selos da fila. */
export async function countDesignQueue(actor: DesignActor) {
  if (!isDesigner(actor.role) && !isStaff(actor.role)) return { abertos: 0, meus: 0 };
  const [abertos, meus] = await Promise.all([
    prisma.budget.count({ where: { designStatus: { in: ETAPAS_ABERTAS } } }),
    prisma.budget.count({
      where: { designerId: actor.id, designStatus: { in: ETAPAS_ABERTAS } },
    }),
  ]);
  return { abertos, meus };
}

/** Imagem da arte, com a checagem de acesso junto. Null = sem permissão. */
export async function getArtFile(actor: DesignActor, budgetId: string, artId: string) {
  const carregado = await carregar(budgetId);
  if (!carregado || !podeVerDesign(actor, carregado.s)) return null;

  return prisma.budgetArt.findFirst({
    where: { id: artId, budgetId },
    select: { data: true, mimeType: true },
  });
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

function autorLabel(actor: DesignActor & { name?: string | null; email?: string }): string {
  return actor.name?.trim() || actor.email || "Usuário";
}

/** Registra o passo no histórico do cliente, junto com os contatos. */
async function anotarNoCliente(
  budgetId: string,
  actor: DesignActor & { name?: string | null; email?: string },
  texto: string,
) {
  const b = await prisma.budget.findUnique({
    where: { id: budgetId },
    select: { clientId: true, number: true },
  });
  if (!b) return;
  await touchClientActivity(b.clientId, actor.id, `Arte do #${b.number}: ${texto}`, autorLabel(actor));
}

type Ator = DesignActor & { name?: string | null; email?: string };

export async function requestDesign(
  actor: Ator,
  budgetId: string,
  brief: string | null,
): Promise<string | null> {
  const carregado = await carregar(budgetId);
  if (!carregado) return "Orçamento não encontrado.";
  if (!podeSolicitar(actor, carregado.s)) {
    return "Este orçamento não pode ser enviado ao design agora.";
  }

  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      designStatus: DesignStatus.SOLICITADO,
      designRequestedAt: new Date(),
      designRequestedById: actor.id,
      designBrief: brief,
      designerNote: null,
    },
  });
  await anotarNoCliente(budgetId, actor, "enviada para o design.");
  return null;
}

export async function cancelDesign(actor: Ator, budgetId: string): Promise<string | null> {
  const carregado = await carregar(budgetId);
  if (!carregado) return "Orçamento não encontrado.";
  if (!podeCancelar(actor, carregado.s)) {
    return "Só dá para cancelar enquanto o design ainda não assumiu.";
  }

  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      designStatus: null,
      designRequestedAt: null,
      designRequestedById: null,
      designerId: null,
      designBrief: null,
    },
  });
  await anotarNoCliente(budgetId, actor, "solicitação cancelada.");
  return null;
}

export async function claimDesign(actor: Ator, budgetId: string): Promise<string | null> {
  const carregado = await carregar(budgetId);
  if (!carregado) return "Orçamento não encontrado.";
  if (!podeAssumir(actor, carregado.s)) return "Este trabalho não está disponível para assumir.";

  // A condição vai dentro do UPDATE: dois designers clicando ao mesmo tempo, o
  // segundo encontra count = 0 em vez de roubar o trabalho do primeiro.
  const res = await prisma.budget.updateMany({
    where: {
      id: budgetId,
      designStatus: { in: [DesignStatus.SOLICITADO, DesignStatus.REVISAO] },
    },
    data: { designStatus: DesignStatus.EM_PRODUCAO, designerId: actor.id },
  });
  if (res.count === 0) return "Outra pessoa assumiu este trabalho primeiro.";

  await anotarNoCliente(budgetId, actor, `assumida por ${autorLabel(actor)}.`);
  return null;
}

export async function deliverDesign(
  actor: Ator,
  budgetId: string,
  nota: string | null,
): Promise<string | null> {
  const carregado = await carregar(budgetId);
  if (!carregado) return "Orçamento não encontrado.";
  if (!podeAnexarArte(actor, carregado.s)) return "Este trabalho não está com você.";
  if (!podeEntregar(actor, carregado.s)) return "Anexe a arte antes de entregar.";

  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      designStatus: DesignStatus.ENTREGUE,
      designDeliveredAt: new Date(),
      designerNote: nota,
      // Quem entregou fica registrado mesmo se não tinha assumido formalmente.
      designerId: carregado.s.designerId ?? actor.id,
    },
  });
  await anotarNoCliente(budgetId, actor, "entregue pelo design.");
  return null;
}

export async function requestRevision(
  actor: Ator,
  budgetId: string,
  motivo: string | null,
): Promise<string | null> {
  const carregado = await carregar(budgetId);
  if (!carregado) return "Orçamento não encontrado.";
  if (!podePedirRevisao(actor, carregado.s)) return "Não há arte entregue para revisar.";

  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      designStatus: DesignStatus.REVISAO,
      // O briefing passa a ser o motivo do ajuste — é o que o designer lê agora.
      designBrief: motivo,
      designerNote: null,
    },
  });
  await anotarNoCliente(budgetId, actor, `revisão solicitada${motivo ? `: ${motivo}` : "."}`);
  return null;
}

export async function approveArt(actor: Ator, budgetId: string): Promise<string | null> {
  const carregado = await carregar(budgetId);
  if (!carregado) return "Orçamento não encontrado.";
  if (!podeAprovarArte(actor, carregado.s)) return "Não há arte entregue para aprovar.";

  await prisma.budget.update({
    where: { id: budgetId },
    data: { designStatus: DesignStatus.APROVADA },
  });
  await anotarNoCliente(budgetId, actor, "aprovada pelo cliente.");
  return null;
}

/**
 * Anexa uma versão da arte. A nova vira a atual e as anteriores ficam no
 * histórico — revisão não apaga o que já foi feito.
 */
export async function addArt(
  actor: Ator,
  budgetId: string,
  file: { bytes: Buffer; mimeType: string; widthPx: number | null; heightPx: number | null },
): Promise<string | null> {
  const carregado = await carregar(budgetId);
  if (!carregado) return "Orçamento não encontrado.";
  if (!podeAnexarArte(actor, carregado.s)) return "Este trabalho não está com você.";

  if (!(TIPOS_ARTE as readonly string[]).includes(file.mimeType)) {
    return "Formato inválido. Use PNG, JPG ou WEBP.";
  }
  if (file.bytes.byteLength > MAX_ARTE_BYTES) {
    return "Arquivo muito grande (máx. 4 MB).";
  }

  await prisma.$transaction(async (tx) => {
    const ultima = await tx.budgetArt.findFirst({
      where: { budgetId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    await tx.budgetArt.updateMany({ where: { budgetId, current: true }, data: { current: false } });
    await tx.budgetArt.create({
      data: {
        budgetId,
        data: file.bytes,
        mimeType: file.mimeType,
        sizeBytes: file.bytes.byteLength,
        widthPx: file.widthPx,
        heightPx: file.heightPx,
        version: (ultima?.version ?? 0) + 1,
        current: true,
        uploadedById: actor.id,
      },
    });
    // Anexar já coloca o trabalho como "em produção" se ainda estava na fila.
    if (carregado.s.designStatus === DesignStatus.SOLICITADO ||
        carregado.s.designStatus === DesignStatus.REVISAO) {
      await tx.budget.update({
        where: { id: budgetId },
        data: { designStatus: DesignStatus.EM_PRODUCAO, designerId: actor.id },
      });
    }
  });

  return null;
}

/** Arte atual, com os bytes — usada só na geração do PDF. */
export function getCurrentArt(budgetId: string) {
  return prisma.budgetArt.findFirst({
    where: { budgetId, current: true },
    select: { data: true, mimeType: true, widthPx: true, heightPx: true },
  });
}
