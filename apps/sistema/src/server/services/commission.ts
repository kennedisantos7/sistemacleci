import { prisma, CommissionStatus, type Sale } from "@cleci/db";
import { commissionFromBps } from "@/lib/money";
import { getConfig } from "./config";

/**
 * Resolve a taxa de comissão (bps) de um usuário: taxa individual quando
 * definida, senão a taxa global padrão.
 */
export async function resolveRateBps(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { commissionRateBps: true },
  });
  if (user?.commissionRateBps != null) return user.commissionRateBps;
  const config = await getConfig();
  return config.defaultRateBps;
}

/**
 * Cria a comissão de uma venda paga, com SNAPSHOT da taxa. Idempotente:
 * se a venda não tem afiliado ou já possui comissão, não faz nada.
 */
export async function createCommissionForSale(sale: Sale) {
  if (!sale.userId) return null;

  const existing = await prisma.commission.findUnique({ where: { saleId: sale.id } });
  if (existing) return existing;

  const rateBps = await resolveRateBps(sale.userId);
  const amountCents = commissionFromBps(sale.amountCents, rateBps);

  return prisma.commission.create({
    data: {
      saleId: sale.id,
      userId: sale.userId,
      rateBps,
      amountCents,
      status: CommissionStatus.PENDENTE,
    },
  });
}

/**
 * Cancela a comissão de uma venda (reembolso/recusa). Não mexe em comissões
 * já LIBERADAS (pagas via saque) — esse caso vira ajuste manual pelo admin.
 */
export async function cancelCommissionForSale(saleId: string) {
  await prisma.commission.updateMany({
    where: {
      saleId,
      status: { in: [CommissionStatus.PENDENTE, CommissionStatus.APROVADA] },
    },
    data: { status: CommissionStatus.CANCELADA },
  });
}

/** Aprova uma comissão pendente, liberando-a para o saldo disponível. */
export async function approveCommission(commissionId: string) {
  await prisma.commission.updateMany({
    where: { id: commissionId, status: CommissionStatus.PENDENTE },
    data: { status: CommissionStatus.APROVADA, approvedAt: new Date() },
  });
}

/** Aprova em lote todas as comissões pendentes (uso administrativo). */
export async function approveAllPending(): Promise<number> {
  const result = await prisma.commission.updateMany({
    where: { status: CommissionStatus.PENDENTE },
    data: { status: CommissionStatus.APROVADA, approvedAt: new Date() },
  });
  return result.count;
}
