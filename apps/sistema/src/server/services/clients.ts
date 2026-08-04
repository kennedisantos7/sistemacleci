import { prisma, ClientActivityType, type Prisma, type Role } from "@cleci/db";
import { z } from "zod";
import { isStaff } from "@/lib/rbac";
import {
  DIAS_ATE_LIBERAR,
  statusTitularidade,
  podeVerDetalhes,
  podeEditar,
  ehTitular,
  type OwnershipStatus,
} from "@/lib/client-ownership";

export type ClientActor = { id: string; role: Role; name?: string | null; email?: string };

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome ou a razão social.").max(160),
  companyName: z.string().trim().max(160).nullable().optional(),
  document: z.string().trim().max(24).nullable().optional(),
  email: z.string().trim().email("E-mail inválido.").max(160).nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(32).nullable().optional(),
  whatsapp: z.string().trim().max(32).nullable().optional(),
  contactName: z.string().trim().max(120).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  state: z.string().trim().max(60).nullable().optional(),
  zip: z.string().trim().max(16).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const activitySchema = z.object({
  type: z.nativeEnum(ClientActivityType).refine((t) => t !== ClientActivityType.SISTEMA, {
    message: "Tipo de atividade inválido.",
  }),
  note: z.string().trim().max(2000).optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;

/** Só os campos escalares da ficha — sem tocar em titularidade nem relações. */
type ClientFields = {
  [K in
    | "name"
    | "companyName"
    | "document"
    | "email"
    | "phone"
    | "whatsapp"
    | "contactName"
    | "address"
    | "city"
    | "state"
    | "zip"
    | "note"]: K extends "name" ? string : string | null;
};

/** Campos vazios viram null — evita gravar "" e sujar o PDF. */
function normalize(data: ClientInput): ClientFields {
  const blankToNull = (v: string | null | undefined) => {
    const trimmed = v?.trim();
    return trimmed ? trimmed : null;
  };
  return {
    name: data.name.trim(),
    companyName: blankToNull(data.companyName),
    document: blankToNull(data.document),
    email: blankToNull(data.email),
    phone: blankToNull(data.phone),
    whatsapp: blankToNull(data.whatsapp),
    contactName: blankToNull(data.contactName),
    address: blankToNull(data.address),
    city: blankToNull(data.city),
    state: blankToNull(data.state),
    zip: blankToNull(data.zip),
    note: blankToNull(data.note),
  };
}

function autorLabel(actor: ClientActor): string {
  return actor.name?.trim() || actor.email || "Usuário";
}

// ---------------------------------------------------------------------------
// Histórico
// ---------------------------------------------------------------------------

/**
 * Registra a atividade E renova o prazo do titular na mesma transação. É o
 * único caminho para mexer em lastActivityAt: prazo e histórico nunca divergem.
 */
async function registrarAtividade(
  tx: Prisma.TransactionClient,
  clientId: string,
  actor: ClientActor,
  type: ClientActivityType,
  note: string | null,
  renovaPrazo: boolean,
) {
  await tx.clientActivity.create({
    data: { clientId, userId: actor.id, authorName: autorLabel(actor), type, note },
  });
  if (renovaPrazo) {
    await tx.client.update({ where: { id: clientId }, data: { lastActivityAt: new Date() } });
  }
}

/**
 * Sinal de trabalho vindo de outra parte do sistema (orçamento salvo). Só conta
 * para quem é titular: um gerente mexendo no orçamento não deve renovar o prazo
 * de um vendedor que abandonou a conta.
 */
export async function touchClientActivity(
  clientId: string,
  actorId: string,
  descricao: string,
  autor: string,
) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { vendedorId: true },
  });
  if (!client) return;

  await prisma.$transaction(async (tx) => {
    await tx.clientActivity.create({
      data: {
        clientId,
        userId: actorId,
        authorName: autor,
        type: ClientActivityType.SISTEMA,
        note: descricao,
      },
    });
    if (client.vendedorId === actorId) {
      await tx.client.update({ where: { id: clientId }, data: { lastActivityAt: new Date() } });
    }
  });
}

export async function addClientActivity(
  actor: ClientActor,
  clientId: string,
  input: ActivityInput,
): Promise<string | null> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, vendedorId: true, lastActivityAt: true },
  });
  if (!client) return "Cliente não encontrado.";
  if (!podeEditar(actor, client)) {
    return "Só o vendedor responsável pode registrar atividades nesta empresa.";
  }

  await prisma.$transaction((tx) =>
    registrarAtividade(
      tx,
      clientId,
      actor,
      input.type,
      input.note?.trim() || null,
      // Gerente/admin lançando nota não renova o prazo de outro vendedor.
      ehTitular(actor, client),
    ),
  );
  return null;
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

const LIST_SELECT = {
  id: true,
  name: true,
  companyName: true,
  document: true,
  city: true,
  state: true,
  phone: true,
  whatsapp: true,
  email: true,
  vendedorId: true,
  ownerSince: true,
  lastActivityAt: true,
  vendedor: { select: { id: true, name: true, email: true } },
  _count: { select: { budgets: true } },
} satisfies Prisma.ClientSelect;

export type ClientListRow = {
  id: string;
  name: string;
  companyName: string | null;
  document: string | null;
  local: string | null;
  status: OwnershipStatus;
  ownerName: string | null;
  isMine: boolean;
  /** Contato liberado; null quando a empresa está bloqueada com outro vendedor. */
  contato: { phone: string | null; whatsapp: string | null; email: string | null } | null;
  budgetCount: number;
};

type ClientRow = Prisma.ClientGetPayload<{ select: typeof LIST_SELECT }>;

function toListRow(actor: ClientActor, c: ClientRow, agora: Date): ClientListRow {
  const status = statusTitularidade(c, agora);
  const liberado = podeVerDetalhes(actor, c, agora);
  return {
    id: c.id,
    name: c.name,
    companyName: c.companyName,
    document: c.document,
    local: [c.city, c.state].filter(Boolean).join("/") || null,
    status,
    ownerName: c.vendedor ? (c.vendedor.name ?? c.vendedor.email) : null,
    isMine: ehTitular(actor, c),
    // O corte é aqui, no servidor: dado bloqueado não chega ao navegador.
    contato: liberado ? { phone: c.phone, whatsapp: c.whatsapp, email: c.email } : null,
    budgetCount: c._count.budgets,
  };
}

/**
 * Busca na base inteira — qualquer vendedor pesquisa qualquer empresa. O que
 * varia por papel não é QUAIS empresas aparecem, e sim QUANTO de cada uma.
 */
export async function listClients(
  actor: ClientActor,
  search?: string,
  filtro?: "minhas" | "disponiveis",
): Promise<ClientListRow[]> {
  const agora = new Date();
  const corte = new Date(agora.getTime() - DIAS_ATE_LIBERAR * 86_400_000);

  const where: Prisma.ClientWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { companyName: { contains: search, mode: "insensitive" } },
            { document: { contains: search } },
          ],
        }
      : {}),
    ...(filtro === "minhas" ? { vendedorId: actor.id } : {}),
    ...(filtro === "disponiveis"
      ? {
          NOT: { vendedorId: actor.id },
          OR: [
            { vendedorId: null },
            { lastActivityAt: null },
            { lastActivityAt: { lte: corte } },
          ],
        }
      : {}),
  };

  const rows = await prisma.client.findMany({
    where,
    orderBy: [{ name: "asc" }],
    take: 100,
    select: LIST_SELECT,
  });

  return rows.map((c) => toListRow(actor, c, agora));
}

/**
 * Opções do seletor de cliente no orçamento: só o que o vendedor pode de fato
 * atender. Empresa de outro vendedor precisa ser assumida antes.
 */
export function listClientOptions(actor: ClientActor) {
  return prisma.client.findMany({
    where: isStaff(actor.role) ? {} : { vendedorId: actor.id },
    orderBy: { name: "asc" },
    take: 500,
    select: {
      id: true,
      name: true,
      companyName: true,
      document: true,
      email: true,
      phone: true,
      whatsapp: true,
      contactName: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });
}

/** Ficha para edição — exige ser titular (ou equipe administrativa). */
export async function getClientForActor(actor: ClientActor, clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return null;
  return podeEditar(actor, client) ? client : null;
}

export type ClientProfile = NonNullable<Awaited<ReturnType<typeof getClientProfile>>>;

/** Perfil completo da empresa: ficha, titularidade, orçamentos e histórico. */
export async function getClientProfile(actor: ClientActor, clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      vendedor: { select: { id: true, name: true, email: true } },
      budgets: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          docType: true,
          totalCents: true,
          createdAt: true,
        },
      },
    },
  });
  if (!client) return null;

  const agora = new Date();
  const status = statusTitularidade(client, agora);
  const liberado = podeVerDetalhes(actor, client, agora);
  const editavel = podeEditar(actor, client);

  // Histórico e orçamentos são parte do "quanto" — empresa bloqueada com outro
  // vendedor mostra só a identificação e quem está atendendo.
  const activities = liberado
    ? await prisma.clientActivity.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, type: true, note: true, authorName: true, createdAt: true },
      })
    : [];

  return {
    id: client.id,
    name: client.name,
    companyName: client.companyName,
    document: client.document,
    local: [client.city, client.state].filter(Boolean).join("/") || null,
    status,
    ownerId: client.vendedorId,
    ownerName: client.vendedor ? (client.vendedor.name ?? client.vendedor.email) : null,
    ownerSince: client.ownerSince,
    lastActivityAt: client.lastActivityAt,
    isMine: ehTitular(actor, client),
    liberado,
    editavel,
    ficha: liberado
      ? {
          email: client.email,
          phone: client.phone,
          whatsapp: client.whatsapp,
          contactName: client.contactName,
          address: client.address,
          city: client.city,
          state: client.state,
          zip: client.zip,
          note: client.note,
        }
      : null,
    budgets: liberado ? client.budgets : [],
    activities,
  };
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

export async function createClient(actor: ClientActor, data: ClientInput) {
  const agora = new Date();
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        vendedorId: actor.id, // quem cadastra vira titular
        ownerSince: agora,
        lastActivityAt: agora,
        ...normalize(data),
      },
    });
    await tx.clientActivity.create({
      data: {
        clientId: client.id,
        userId: actor.id,
        authorName: autorLabel(actor),
        type: ClientActivityType.SISTEMA,
        note: `Empresa cadastrada por ${autorLabel(actor)}.`,
      },
    });
    return client;
  });
}

/** Atualiza a ficha. Editar é sinal de trabalho: renova o prazo do titular. */
export async function updateClient(actor: ClientActor, clientId: string, data: ClientInput) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, vendedorId: true, lastActivityAt: true },
  });
  if (!client) throw new Error("Cliente não encontrado.");
  if (!podeEditar(actor, client)) {
    throw new Error("Esta empresa está com outro vendedor.");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      ...normalize(data),
      ...(ehTitular(actor, client) ? { lastActivityAt: new Date() } : {}),
    },
  });
}

/**
 * Assume a empresa. A condição da regra vai dentro do próprio UPDATE: se dois
 * vendedores clicarem ao mesmo tempo, o segundo encontra count = 0 em vez de
 * sobrescrever o primeiro.
 */
export async function claimClient(actor: ClientActor, clientId: string): Promise<string | null> {
  const agora = new Date();
  const corte = new Date(agora.getTime() - DIAS_ATE_LIBERAR * 86_400_000);

  const anterior = await prisma.client.findUnique({
    where: { id: clientId },
    select: { vendedorId: true, vendedor: { select: { name: true, email: true } } },
  });
  if (!anterior) return "Cliente não encontrado.";
  if (anterior.vendedorId === actor.id) return "Esta empresa já é sua.";

  const res = await prisma.client.updateMany({
    where: {
      id: clientId,
      NOT: { vendedorId: actor.id },
      OR: [{ vendedorId: null }, { lastActivityAt: null }, { lastActivityAt: { lte: corte } }],
    },
    data: { vendedorId: actor.id, ownerSince: agora, lastActivityAt: agora },
  });
  if (res.count === 0) {
    return "Esta empresa está em atendimento por outro vendedor.";
  }

  const antigo = anterior.vendedor
    ? (anterior.vendedor.name ?? anterior.vendedor.email)
    : "ninguém";
  await prisma.clientActivity.create({
    data: {
      clientId,
      userId: actor.id,
      authorName: autorLabel(actor),
      type: ClientActivityType.SISTEMA,
      note: `${autorLabel(actor)} assumiu o atendimento (antes: ${antigo}).`,
    },
  });
  return null;
}

/** O titular abre mão da empresa, devolvendo-a para a base. */
export async function releaseClient(actor: ClientActor, clientId: string): Promise<string | null> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, vendedorId: true, lastActivityAt: true },
  });
  if (!client) return "Cliente não encontrado.";
  if (!podeEditar(actor, client)) return "Esta empresa não está com você.";

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: { vendedorId: null, ownerSince: null, lastActivityAt: null },
    });
    await tx.clientActivity.create({
      data: {
        clientId,
        userId: actor.id,
        authorName: autorLabel(actor),
        type: ClientActivityType.SISTEMA,
        note: `${autorLabel(actor)} liberou a empresa para a equipe.`,
      },
    });
  });
  return null;
}

/** Transferência direta, só para a equipe administrativa. */
export async function transferClient(
  actor: ClientActor,
  clientId: string,
  paraUserId: string,
): Promise<string | null> {
  if (!isStaff(actor.role)) return "Sem permissão para transferir clientes.";

  const destino = await prisma.user.findUnique({
    where: { id: paraUserId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!destino) return "Vendedor não encontrado.";
  if (destino.role === "AFILIADO") return "Afiliados não atendem a carteira de clientes.";

  const agora = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: { vendedorId: destino.id, ownerSince: agora, lastActivityAt: agora },
    });
    await tx.clientActivity.create({
      data: {
        clientId,
        userId: actor.id,
        authorName: autorLabel(actor),
        type: ClientActivityType.SISTEMA,
        note: `${autorLabel(actor)} transferiu o atendimento para ${destino.name ?? destino.email}.`,
      },
    });
  });
  return null;
}

/** Vendedores elegíveis a receber uma transferência (afiliado fora). */
export function listTransferTargets() {
  return prisma.user.findMany({
    where: { status: "ATIVO", role: { in: ["ADMIN", "DESENVOLVEDOR", "GERENTE", "VENDEDOR_FIXO"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

/**
 * Exclui um cliente. Bloqueado se já tem orçamentos — o histórico comercial
 * nunca é apagado (libere a empresa em vez disso).
 */
export async function deleteClient(actor: ClientActor, clientId: string): Promise<string | null> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, vendedorId: true, lastActivityAt: true },
  });
  if (!client) return "Cliente não encontrado.";
  if (!podeEditar(actor, client)) return "Esta empresa está com outro vendedor.";

  const budgetCount = await prisma.budget.count({ where: { clientId } });
  if (budgetCount > 0) {
    return "Este cliente já tem orçamentos registrados — não pode ser excluído.";
  }

  await prisma.client.delete({ where: { id: clientId } });
  return null;
}
