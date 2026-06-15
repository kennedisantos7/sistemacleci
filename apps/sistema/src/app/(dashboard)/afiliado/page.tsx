import { requireUser } from "@/server/session";
import { getBalance } from "@/server/services/balance";
import { StatCard } from "@/components/stat-card";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AfiliadoDashboard() {
  const user = await requireUser(["AFILIADO"]);
  const balance = await getBalance(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Minhas comissões</h1>
        <p className="text-muted-foreground">Acompanhe seus ganhos e saldo disponível.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pendente" value={formatCents(balance.pendenteCents)} hint="Em aprovação" />
        <StatCard
          title="Disponível"
          value={formatCents(balance.disponivelCents)}
          hint="Pronto para saque"
        />
        <StatCard title="Em saque" value={formatCents(balance.emSaqueCents)} hint="Solicitado/aprovado" />
        <StatCard title="Recebido" value={formatCents(balance.liberadoCents)} hint="Pago via saques" />
      </div>
    </div>
  );
}
