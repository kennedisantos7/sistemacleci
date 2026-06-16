import { prisma, SaleStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { getGoalProgress } from "@/server/services/goals";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function VendedorDashboard() {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const userId = user.id;

  const [paid, pending, linkCount, goal] = await Promise.all([
    prisma.sale.aggregate({
      where: { userId, status: SaleStatus.PAGO },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.sale.count({ where: { userId, status: SaleStatus.PENDENTE } }),
    prisma.affiliateLink.count({ where: { userId } }),
    getGoalProgress(userId),
  ]);

  const remaining = Math.max(0, goal.targetCents - goal.achievedCents);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Minhas vendas</h1>
        <p className="text-muted-foreground">Acompanhe sua conversão e metas.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Vendas pagas"
          value={formatCents(paid._sum.amountCents ?? 0)}
          hint={`${paid._count} pedidos`}
        />
        <StatCard title="Pedidos pendentes" value={String(pending)} />
        <StatCard title="Links ativos" value={String(linkCount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta do mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {goal.targetCents === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma meta definida para este mês. Fale com o administrador.
            </p>
          ) : (
            <>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{formatCents(goal.achievedCents)}</span>
                <span className="text-sm text-muted-foreground">
                  meta {formatCents(goal.targetCents)} · {goal.percent}%
                </span>
              </div>
              <ProgressBar percent={goal.percent} />
              <p className="text-xs text-muted-foreground">
                {goal.percent >= 100
                  ? "Meta batida! 🎉"
                  : `Faltam ${formatCents(remaining)} para bater a meta.`}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
