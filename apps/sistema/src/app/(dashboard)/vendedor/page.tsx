import { prisma, SaleStatus } from "@cleci/db";
import { auth } from "@/auth";
import { StatCard } from "@/components/stat-card";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function VendedorDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const [paid, pending, linkCount] = await Promise.all([
    prisma.sale.aggregate({
      where: { userId, status: SaleStatus.PAGO },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.sale.count({ where: { userId, status: SaleStatus.PENDENTE } }),
    prisma.affiliateLink.count({ where: { userId } }),
  ]);

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
    </div>
  );
}
