import { prisma, CommissionStatus } from "@cleci/db";

export type Balance = {
  pendenteCents: number; // comissões aguardando aprovação do admin
  disponivelCents: number; // aprovadas e ainda não vinculadas a um saque
  emSaqueCents: number; // aprovadas já vinculadas a um saque em andamento
  liberadoCents: number; // já pagas via saque
};

async function sumWhere(where: object): Promise<number> {
  const agg = await prisma.commission.aggregate({ where, _sum: { amountCents: true } });
  return agg._sum.amountCents ?? 0;
}

/** Calcula o saldo do usuário a partir das comissões (fonte da verdade). */
export async function getBalance(userId: string): Promise<Balance> {
  const [pendente, disponivel, emSaque, liberado] = await Promise.all([
    sumWhere({ userId, status: CommissionStatus.PENDENTE }),
    sumWhere({ userId, status: CommissionStatus.APROVADA, payoutId: null }),
    sumWhere({ userId, status: CommissionStatus.APROVADA, payoutId: { not: null } }),
    sumWhere({ userId, status: CommissionStatus.LIBERADA }),
  ]);

  return {
    pendenteCents: pendente,
    disponivelCents: disponivel,
    emSaqueCents: emSaque,
    liberadoCents: liberado,
  };
}
