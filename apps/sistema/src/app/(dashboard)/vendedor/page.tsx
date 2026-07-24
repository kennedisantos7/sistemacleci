import Link from "next/link";
import { prisma, BudgetStatus, SaleStatus } from "@cleci/db";
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

  const [paid, pending, budgetsSent, budgetsAccepted, goal] = await Promise.all([
    prisma.sale.aggregate({
      where: { userId, status: SaleStatus.PAGO },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.sale.count({ where: { userId, status: SaleStatus.PENDENTE } }),
    prisma.budget.count({ where: { vendedorId: userId, status: BudgetStatus.ENVIADO } }),
    prisma.budget.count({ where: { vendedorId: userId, status: BudgetStatus.ACEITO } }),
    getGoalProgress(userId),
  ]);

  const remaining = Math.max(0, goal.targetCents - goal.achievedCents);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Minhas vendas</h1>
        <p className="text-muted-foreground">Acompanhe sua conversão e metas.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vendas finalizadas"
          value={formatCents(paid._sum.amountCents ?? 0)}
          hint={`${paid._count} pedidos`}
        />
        <StatCard title="Vendas pendentes" value={String(pending)} hint="Aguardando finalização" />
        <StatCard title="Orçamentos enviados" value={String(budgetsSent)} hint="Aguardando resposta" />
        <StatCard title="Orçamentos aceitos" value={String(budgetsAccepted)} />
      </div>

      <p className="text-sm">
        <Link href="/vendedor/orcamentos" className="text-primary hover:underline">
          Ver todos os orçamentos →
        </Link>
      </p>

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
