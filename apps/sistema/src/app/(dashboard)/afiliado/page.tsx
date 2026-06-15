import { prisma, CommissionStatus } from "@cleci/db";
import { auth } from "@/auth";
import { StatCard } from "@/components/stat-card";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

async function sumCommissions(userId: string, status: CommissionStatus) {
  const agg = await prisma.commission.aggregate({
    where: { userId, status },
    _sum: { amountCents: true },
  });
  return agg._sum.amountCents ?? 0;
}

export default async function AfiliadoDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const [pendente, aprovada, liberada] = await Promise.all([
    sumCommissions(userId, CommissionStatus.PENDENTE),
    sumCommissions(userId, CommissionStatus.APROVADA),
    sumCommissions(userId, CommissionStatus.LIBERADA),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Minhas comissões</h1>
        <p className="text-muted-foreground">Acompanhe seus ganhos e saldo disponível.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Pendente" value={formatCents(pendente)} hint="Em período de aprovação" />
        <StatCard
          title="Disponível para saque"
          value={formatCents(aprovada)}
          hint="Comissões aprovadas"
        />
        <StatCard title="Já recebido" value={formatCents(liberada)} hint="Pago via saques" />
      </div>
    </div>
  );
}
