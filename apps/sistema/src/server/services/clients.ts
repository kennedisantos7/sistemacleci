import { prisma } from "@cleci/db";

export type ClientInput = {
  name: string;
  companyName?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
};

/** Lista os clientes do vendedor (com busca opcional por nome/empresa/documento). */
export function listClients(vendedorId: string, search?: string) {
  return prisma.client.findMany({
    where: {
      vendedorId,
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
    include: { _count: { select: { budgets: true } } },
  });
}

/** Busca um cliente garantindo que pertence ao vendedor. */
export function getClientForVendedor(vendedorId: string, clientId: string) {
  return prisma.client.findFirst({ where: { id: clientId, vendedorId } });
}

export function createClient(vendedorId: string, data: ClientInput) {
  return prisma.client.create({ data: { vendedorId, ...data } });
}

/** Atualiza somente se o cliente pertencer ao vendedor. */
export async function updateClient(vendedorId: string, clientId: string, data: ClientInput) {
  const res = await prisma.client.updateMany({
    where: { id: clientId, vendedorId },
    data,
  });
  if (res.count === 0) throw new Error("Cliente não encontrado.");
}

/**
 * Exclui um cliente do vendedor. Bloqueado se o cliente já tem orçamentos —
 * o histórico comercial nunca é apagado (bloqueie/ignore o cliente em vez disso).
 */
export async function deleteClient(vendedorId: string, clientId: string): Promise<string | null> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, vendedorId },
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
