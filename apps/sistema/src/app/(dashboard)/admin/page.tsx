import { prisma, SaleStatus, UserStatus, PayoutStatus, CommissionStatus } from "@cleci/db";
import { StatCard } from "@/components/stat-card";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [pendingUsers, paidAgg, pendingPayouts, openCommissionsAgg, paidCommissionsAgg] =
    await Promise.all([
      prisma.user.count({ where: { status: UserStatus.PENDENTE } }),
      prisma.sale.aggregate({
        where: { status: SaleStatus.PAGO },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.payout.count({ where: { status: PayoutStatus.SOLICITADO } }),
      prisma.commission.aggregate({
        where: { status: { in: [CommissionStatus.PENDENTE, CommissionStatus.APROVADA] } },
        _sum: { amountCents: true },
      }),
      // Todas as comissões (afiliado + desenvolvedor) já geradas sobre vendas
      // pagas, exceto as canceladas — é o que sai do valor total do admin.
      prisma.commission.aggregate({
        where: { status: { not: CommissionStatus.CANCELADA }, sale: { status: SaleStatus.PAGO } },
        _sum: { amountCents: true },
      }),
    ]);

  const totalCents = paidAgg._sum.amountCents ?? 0;
  const commissionsCents = paidCommissionsAgg._sum.amountCents ?? 0;
  const netCents = totalCents - commissionsCents;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboard financeiro</h1>
        <p className="text-muted-foreground">Visão geral da operação de afiliados e vendas.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Valor total recebido"
          value={formatCents(totalCents)}
          hint={`${paidAgg._count} vendas confirmadas`}
        />
        <StatCard
          title="Valor líquido (após comissões)"
          value={formatCents(netCents)}
          hint={`${formatCents(commissionsCents)} em comissões (afiliado + dev)`}
        />
        <StatCard
          title="Comissões a pagar"
          value={formatCents(openCommissionsAgg._sum.amountCents ?? 0)}
          hint="Pendentes + aprovadas"
        />
        <StatCard title="Saques solicitados" value={String(pendingPayouts)} hint="Aguardando autorização" />
        <StatCard title="Cadastros pendentes" value={String(pendingUsers)} hint="Aguardando aprovação" />
      </div>
    </div>
  );
}
