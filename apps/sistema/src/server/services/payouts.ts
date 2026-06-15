import { prisma, CommissionStatus, PayoutStatus } from "@cleci/db";

/**
 * Solicita um saque: vincula todas as comissões APROVADAS e livres do usuário
 * a um novo Payout. Roda em transação e recalcula o valor a partir das
 * comissões realmente vinculadas (defesa contra corrida/double-spend).
 */
export async function requestPayout(userId: string) {
  return prisma.$transaction(async (tx) => {
    const info = await tx.paymentInfo.findUnique({ where: { userId } });

    const payout = await tx.payout.create({
      data: {
        userId,
        amountCents: 0,
        status: PayoutStatus.SOLICITADO,
        method: info?.pixKey ? "pix" : null,
        pixKey: info?.pixKey ?? null,
      },
    });

    // Vincula apenas comissões aprovadas e ainda livres (payoutId nulo).
    await tx.commission.updateMany({
      where: { userId, status: CommissionStatus.APROVADA, payoutId: null },
      data: { payoutId: payout.id },
    });

    // Recalcula o valor a partir do que foi efetivamente vinculado.
    const agg = await tx.commission.aggregate({
      where: { payoutId: payout.id },
      _sum: { amountCents: true },
    });
    const total = agg._sum.amountCents ?? 0;

    if (total <= 0) {
      throw new Error("Sem saldo disponível para saque.");
    }

    return tx.payout.update({
      where: { id: payout.id },
      data: { amountCents: total },
    });
  });
}

export async function approvePayout(payoutId: string) {
  const res = await prisma.payout.updateMany({
    where: { id: payoutId, status: PayoutStatus.SOLICITADO },
    data: { status: PayoutStatus.APROVADO },
  });
  if (res.count === 0) throw new Error("Saque não está em estado solicitável.");
}

/** Paga o saque e libera as comissões vinculadas (APROVADA -> LIBERADA). */
export async function payPayout(payoutId: string, opts: { method?: string; note?: string }) {
  return prisma.$transaction(async (tx) => {
    const res = await tx.payout.updateMany({
      where: { id: payoutId, status: PayoutStatus.APROVADO },
      data: {
        status: PayoutStatus.PAGO,
        processedAt: new Date(),
        method: opts.method ?? undefined,
        note: opts.note ?? undefined,
      },
    });
    if (res.count === 0) throw new Error("Saque precisa estar aprovado para ser pago.");

    await tx.commission.updateMany({
      where: { payoutId, status: CommissionStatus.APROVADA },
      data: { status: CommissionStatus.LIBERADA },
    });
  });
}

/** Rejeita o saque e devolve as comissões ao saldo disponível. */
export async function rejectPayout(payoutId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const res = await tx.payout.updateMany({
      where: { id: payoutId, status: { in: [PayoutStatus.SOLICITADO, PayoutStatus.APROVADO] } },
      data: { status: PayoutStatus.REJEITADO, processedAt: new Date(), note: note ?? undefined },
    });
    if (res.count === 0) throw new Error("Saque não pode ser rejeitado neste estado.");

    // Desvincula: comissões voltam a APROVADA e livres.
    await tx.commission.updateMany({
      where: { payoutId },
      data: { payoutId: null },
    });
  });
}
