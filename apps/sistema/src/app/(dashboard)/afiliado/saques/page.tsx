import { prisma, type PayoutStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { getBalance } from "@/server/services/balance";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { PaymentInfoForm } from "./payment-info-form";
import { RequestPayoutForm } from "./request-payout-form";

export const dynamic = "force-dynamic";

const PAYOUT_LABEL: Record<PayoutStatus, string> = {
  SOLICITADO: "Solicitado",
  APROVADO: "Aprovado",
  PAGO: "Pago",
  REJEITADO: "Rejeitado",
};

export default async function AfiliadoSaquesPage() {
  const user = await requireUser(["AFILIADO"]);

  const [balance, info, payouts] = await Promise.all([
    getBalance(user.id),
    prisma.paymentInfo.findUnique({ where: { userId: user.id } }),
    prisma.payout.findMany({ where: { userId: user.id }, orderBy: { requestedAt: "desc" }, take: 20 }),
  ]);

  const disabledReason =
    balance.disponivelCents <= 0
      ? "Você não tem saldo disponível para saque."
      : !info?.pixKey
        ? "Cadastre sua chave Pix antes de solicitar."
        : undefined;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Meus saques</h1>
        <p className="text-muted-foreground">Solicite o saque das comissões aprovadas.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pendente" value={formatCents(balance.pendenteCents)} hint="Aguardando aprovação" />
        <StatCard title="Disponível" value={formatCents(balance.disponivelCents)} hint="Pode sacar" />
        <StatCard title="Em saque" value={formatCents(balance.emSaqueCents)} hint="Solicitado/aprovado" />
        <StatCard title="Recebido" value={formatCents(balance.liberadoCents)} hint="Pago" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitar saque</CardTitle>
          <CardDescription>
            O valor disponível ({formatCents(balance.disponivelCents)}) será solicitado de uma vez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestPayoutForm disabledReason={disabledReason} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentInfoForm pixKey={info?.pixKey} document={info?.document} bankName={info?.bankName} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de saques ({payouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum saque ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{formatCents(p.amountCents)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.requestedAt.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">{PAYOUT_LABEL[p.status]}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
