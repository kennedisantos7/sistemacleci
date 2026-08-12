import { prisma, SaleStatus } from "@cleci/db";

export type Period = { year: number; month: number };

/** Período (ano/mês) atual. */
export function currentPeriod(): Period {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Intervalo [início, fim) do mês. */
function periodRange({ year, month }: Period) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

/** Soma das vendas PAGAS atribuídas ao usuário dentro do período (por paidAt). */
export async function getAchievedCents(userId: string, period: Period): Promise<number> {
  const { start, end } = periodRange(period);
  const agg = await prisma.sale.aggregate({
    where: {
      userId,
      status: SaleStatus.PAGO,
      paidAt: { gte: start, lt: end },
    },
    _sum: { amountCents: true },
  });
  return agg._sum.amountCents ?? 0;
}

export type GoalProgress = {
  period: Period;
  targetCents: number;
  achievedCents: number;
  percent: number; // 0-100+ (pode passar de 100)
};

/** Progresso da meta do usuário no período (atual por padrão). */
export async function getGoalProgress(userId: string, period = currentPeriod()): Promise<GoalProgress> {
  const [goal, achievedCents] = await Promise.all([
    prisma.salesGoal.findUnique({
      where: { userId_year_month: { userId, year: period.year, month: period.month } },
    }),
    getAchievedCents(userId, period),
  ]);
  const targetCents = goal?.targetCents ?? 0;
  const percent = targetCents > 0 ? Math.round((achievedCents / targetCents) * 100) : 0;
  return { period, targetCents, achievedCents, percent };
}

/**
 * Meta e realizado de vários usuários de uma vez. Duas consultas agrupadas no
 * lugar de duas por vendedor — é o que o painel da equipe usa para não fazer
 * N+1 conforme o time cresce.
 */
export async function getGoalProgressMany(
  userIds: string[],
  period = currentPeriod(),
): Promise<Map<string, GoalProgress>> {
  const vazio = new Map<string, GoalProgress>();
  if (userIds.length === 0) return vazio;

  const { start, end } = periodRange(period);
  const [goals, vendas] = await Promise.all([
    prisma.salesGoal.findMany({
      where: { userId: { in: userIds }, year: period.year, month: period.month },
      select: { userId: true, targetCents: true },
    }),
    prisma.sale.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: SaleStatus.PAGO, paidAt: { gte: start, lt: end } },
      _sum: { amountCents: true },
    }),
  ]);

  const alvoPor = new Map(goals.map((g) => [g.userId, g.targetCents]));
  const feitoPor = new Map(vendas.map((v) => [v.userId, v._sum.amountCents ?? 0]));

  for (const userId of userIds) {
    const targetCents = alvoPor.get(userId) ?? 0;
    const achievedCents = feitoPor.get(userId) ?? 0;
    vazio.set(userId, {
      period,
      targetCents,
      achievedCents,
      percent: targetCents > 0 ? Math.round((achievedCents / targetCents) * 100) : 0,
    });
  }
  return vazio;
}

/** Define/atualiza a meta de um usuário para o período. */
export async function upsertGoal(userId: string, period: Period, targetCents: number) {
  return prisma.salesGoal.upsert({
    where: { userId_year_month: { userId, year: period.year, month: period.month } },
    update: { targetCents },
    create: { userId, year: period.year, month: period.month, targetCents },
  });
}

/** Lista vendedores com meta e realizado no período (uso administrativo). */
export async function listVendedorGoals(period = currentPeriod()) {
  const vendedores = await prisma.user.findMany({
    where: { role: "VENDEDOR_FIXO" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  const progresso = await getGoalProgressMany(
    vendedores.map((v) => v.id),
    period,
  );

  return vendedores.map((v) => ({ ...v, ...progresso.get(v.id)! }));
}
