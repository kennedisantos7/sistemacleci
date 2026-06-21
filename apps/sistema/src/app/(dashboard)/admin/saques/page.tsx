import { prisma, CommissionStatus, PayoutStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCents, bpsToPercent } from "@/lib/money";
import { approveCommissionAction, approveAllPendingAction } from "@/server/actions/commissions";
import { approvePayoutAction, payPayoutAction, rejectPayoutAction } from "@/server/actions/payouts";

export const dynamic = "force-dynamic";

export default async function AdminSaquesPage() {
  await requireUser(FULL_ACCESS_ROLES);

  const [pendingCommissions, openPayouts, historyPayouts] = await Promise.all([
    prisma.commission.findMany({
      where: { status: CommissionStatus.PENDENTE },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
        sale: { select: { amountCents: true } },
      },
    }),
    prisma.payout.findMany({
      where: { status: { in: [PayoutStatus.SOLICITADO, PayoutStatus.APROVADO] } },
      orderBy: { requestedAt: "asc" },
      include: { user: { select: { name: true, email: true, paymentInfo: true } } },
    }),
    prisma.payout.findMany({
      where: { status: { in: [PayoutStatus.PAGO, PayoutStatus.REJEITADO] } },
      orderBy: { processedAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Comissões e saques</h1>
        <p className="text-muted-foreground">Aprove comissões e autorize os pagamentos.</p>
      </header>

      {/* Aprovação de comissões */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Comissões pendentes ({pendingCommissions.length})</CardTitle>
            <CardDescription>Aprovar libera a comissão para o saldo do afiliado.</CardDescription>
          </div>
          {pendingCommissions.length > 0 ? (
            <form action={approveAllPendingAction}>
              <Button size="sm" type="submit">
                Aprovar todas
              </Button>
            </form>
          ) : null}
        </CardHeader>
        <CardContent>
          {pendingCommissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma comissão pendente.</p>
          ) : (
            <div className="divide-y divide-border">
              {pendingCommissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{formatCents(c.amountCents)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.user.name ?? c.user.email} · venda {formatCents(c.sale.amountCents)} ·{" "}
                      {bpsToPercent(c.rateBps)}
                    </p>
                  </div>
                  <form action={approveCommissionAction}>
                    <input type="hidden" name="commissionId" value={c.id} />
                    <Button size="sm" variant="outline" type="submit">
                      Aprovar
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saques em aberto */}
      <Card>
        <CardHeader>
          <CardTitle>Saques em aberto ({openPayouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {openPayouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum saque em aberto.</p>
          ) : (
            <div className="divide-y divide-border">
              {openPayouts.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {formatCents(p.amountCents)} ·{" "}
                      <span className="text-sm text-muted-foreground">{p.status}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.user.name ?? p.user.email} · Pix: {p.user.paymentInfo?.pixKey ?? "não informado"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {p.status === PayoutStatus.SOLICITADO && (
                      <form action={approvePayoutAction}>
                        <input type="hidden" name="payoutId" value={p.id} />
                        <Button size="sm" type="submit">
                          Aprovar
                        </Button>
                      </form>
                    )}
                    {p.status === PayoutStatus.APROVADO && (
                      <form action={payPayoutAction}>
                        <input type="hidden" name="payoutId" value={p.id} />
                        <Button size="sm" type="submit">
                          Marcar como pago
                        </Button>
                      </form>
                    )}
                    <form action={rejectPayoutAction}>
                      <input type="hidden" name="payoutId" value={p.id} />
                      <Button size="sm" variant="destructive" type="submit">
                        Rejeitar
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico ({historyPayouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {historyPayouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem histórico.</p>
          ) : (
            <div className="divide-y divide-border">
              {historyPayouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{formatCents(p.amountCents)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.user.name ?? p.user.email} ·{" "}
                      {p.processedAt?.toLocaleDateString("pt-BR") ?? "—"}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
