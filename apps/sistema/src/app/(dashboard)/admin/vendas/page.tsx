import { prisma, SaleStatus, CommissionStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { ManualSaleForm } from "./manual-sale-form";
import { confirmManualSalePaidAction } from "@/server/actions/sales";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<SaleStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  PAGO: "bg-green-100 text-green-800",
  RECUSADO: "bg-red-100 text-red-800",
  REEMBOLSADO: "bg-zinc-200 text-zinc-700",
};

export default async function AdminVendasPage() {
  await requireUser(STAFF_ROLES);

  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { name: true, email: true } },
      commissions: { where: { status: { not: CommissionStatus.CANCELADA } } },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Vendas</h1>
        <p className="text-muted-foreground">Registre vendas do WhatsApp e acompanhe as do checkout.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Registrar venda manual (WhatsApp)</CardTitle>
          <CardDescription>
            Informe o código <code>ref</code> que veio na mensagem para atribuir ao afiliado. Se
            salvar como pendente, confirme o pagamento depois na lista abaixo — só assim as
            comissões (afiliado + desenvolvedor) são geradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualSaleForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas vendas ({sales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma venda ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {sales.map((s) => {
                const commissionsCents = s.commissions.reduce((sum, c) => sum + c.amountCents, 0);
                const netCents = s.amountCents - commissionsCents;
                const canConfirm = s.status === SaleStatus.PENDENTE && s.origin === "WHATSAPP_MANUAL";

                return (
                  <div
                    key={s.id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {formatCents(s.amountCents)} ·{" "}
                        <span className="text-sm text-muted-foreground">
                          {s.origin === "WHATSAPP_MANUAL" ? "WhatsApp" : "Checkout"}
                        </span>
                        {commissionsCents > 0 ? (
                          <span className="text-sm text-muted-foreground">
                            {" "}
                            · líquido {formatCents(netCents)} (−{formatCents(commissionsCents)} comissões)
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.customerName ?? s.customerEmail ?? "—"} ·{" "}
                        {s.user ? `afiliado: ${s.user.name ?? s.user.email}` : "sem atribuição"} ·{" "}
                        {s.createdAt.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {canConfirm && (
                        <form action={confirmManualSalePaidAction}>
                          <input type="hidden" name="saleId" value={s.id} />
                          <Button size="sm" type="submit">
                            Confirmar pagamento
                          </Button>
                        </form>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
