import { prisma, type Prisma, type Role } from "@cleci/db";
import { z } from "zod";
import { canSeeAllBudgets } from "@/lib/rbac";

export type ClientActor = { id: string; role: Role };

/** Vendedor vê só a própria carteira; admin/gerente veem a de toda a equipe. */
function scopeWhere(actor: ClientActor): Prisma.ClientWhereInput {
  return canSeeAllBudgets(actor.role) ? {} : { vendedorId: actor.id };
}

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

/** Campos vazios viram null — evita gravar "" e sujar o PDF. */
function normalize(data: ClientInput): Prisma.ClientCreateWithoutVendedorInput {
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

/** Lista os clientes visíveis (busca opcional por nome/empresa/documento). */
export function listClients(actor: ClientActor, search?: string) {
  return prisma.client.findMany({
    where: {
      ...scopeWhere(actor),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { companyName: { contains: search, mode: "insensitive" } },
              { document: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 100,
    include: {
      _count: { select: { budgets: true } },
      vendedor: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Opções para o seletor de cliente do orçamento. */
export function listClientOptions(actor: ClientActor) {
  return prisma.client.findMany({
    where: scopeWhere(actor),
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

/** Busca um cliente respeitando o escopo do papel. */
export function getClientForActor(actor: ClientActor, clientId: string) {
  return prisma.client.findFirst({ where: { id: clientId, ...scopeWhere(actor) } });
}

export function createClient(actor: ClientActor, data: ClientInput) {
  // O cliente nasce na carteira de quem cadastrou.
  return prisma.client.create({ data: { vendedorId: actor.id, ...normalize(data) } });
}

/** Atualiza somente se o cliente estiver no escopo. */
export async function updateClient(actor: ClientActor, clientId: string, data: ClientInput) {
  const res = await prisma.client.updateMany({
    where: { id: clientId, ...scopeWhere(actor) },
    data: normalize(data),
  });
  if (res.count === 0) throw new Error("Cliente não encontrado.");
}

/**
 * Exclui um cliente. Bloqueado se já tem orçamentos — o histórico comercial
 * nunca é apagado (bloqueie/ignore o cliente em vez disso).
 */
export async function deleteClient(actor: ClientActor, clientId: string): Promise<string | null> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, ...scopeWhere(actor) },
    select: { id: true },
  });
  if (!client) return "Cliente não encontrado.";

  const budgetCount = await prisma.budget.count({ where: { clientId } });
  if (budgetCount > 0) {
    return "Este cliente já tem orçamentos registrados — não pode ser excluído.";
  }

  await prisma.client.delete({ where: { id: clientId } });
  return null;
}
