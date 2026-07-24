import Link from "next/link";
import { notFound } from "next/navigation";
import { BudgetStatus, SaleStatus } from "@cleci/db";
import { FileDown, Pencil } from "lucide-react";
import { requireUser } from "@/server/session";
import { getBudgetForVendedor, isBudgetOverdue } from "@/server/services/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatCents, formatQuantity } from "@/lib/money";
import {
  sendBudgetAction,
  revertBudgetAction,
  acceptBudgetAction,
  rejectBudgetAction,
  finalizeBudgetSaleAction,
} from "../actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<BudgetStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  ACEITO: "Aceito",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
};

const STATUS_STYLE: Record<BudgetStatus, string> = {
  RASCUNHO: "bg-zinc-200 text-zinc-700",
  ENVIADO: "bg-blue-100 text-blue-800",
  ACEITO: "bg-green-100 text-green-800",
  RECUSADO: "bg-red-100 text-red-800",
  EXPIRADO: "bg-amber-100 text-amber-800",
};

export default async function OrcamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const { id } = await params;

  const budget = await getBudgetForVendedor(user.id, id);
  if (!budget) notFound();

  const overdue = isBudgetOverdue(budget);
  const saleFinalized = budget.sale?.status === SaleStatus.PAGO;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Orçamento #{budget.number}
            {budget.title ? <span className="text-muted-foreground"> — {budget.title}</span> : null}
          </h1>
          <p className="text-muted-foreground">
            {budget.client.name}
            {budget.client.companyName ? ` · ${budget.client.companyName}` : ""} · criado em{" "}
            {budget.createdAt.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {overdue ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Vencido
            </span>
          ) : null}
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLE[budget.status]}`}
          >
            {STATUS_LABEL[budget.status]}
          </span>
        </div>
      </header>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/api/orcamentos/${budget.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <FileDown className="h-4 w-4" /> Exportar PDF
        </a>

        {budget.status === BudgetStatus.RASCUNHO && (
          <>
            <Link
              href={`/vendedor/orcamentos/${budget.id}/editar`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="h-4 w-4" /> Editar
            </Link>
            <ConfirmSubmitButton
              action={sendBudgetAction}
              hidden={{ budgetId: budget.id }}
              label="Marcar como enviado"
              pendingLabel="Enviando..."
              variant="outline"
              confirmMessage="Marcar como enviado? O orçamento não poderá mais ser editado (só voltando para rascunho)."
            />
          </>
        )}

        {budget.status === BudgetStatus.ENVIADO && (
          <>
            <ConfirmSubmitButton
              action={acceptBudgetAction}
              hidden={{ budgetId: budget.id }}
              label="Cliente aceitou"
              pendingLabel="Registrando..."
              variant="outline"
              confirmMessage="Registrar o aceite do cliente? Isso cria a venda correspondente no seu controle."
            />
            <ConfirmSubmitButton
              action={rejectBudgetAction}
              hidden={{ budgetId: budget.id }}
              label="Cliente recusou"
              pendingLabel="Registrando..."
              variant="destructive"
              confirmMessage="Registrar a recusa do cliente?"
            />
            <form action={revertBudgetAction}>
              <input type="hidden" name="budgetId" value={budget.id} />
              <button
                type="submit"
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                Voltar para rascunho
              </button>
            </form>
          </>
        )}

        {budget.status === BudgetStatus.ACEITO && budget.sale && !saleFinalized && (
          <ConfirmSubmitButton
            action={finalizeBudgetSaleAction}
            hidden={{ budgetId: budget.id }}
            label="Marcar venda como finalizada"
            pendingLabel="Finalizando..."
            variant="outline"
            confirmMessage="Confirmar que a venda foi finalizada (paga/entregue)?"
          />
        )}
      </div>

      {budget.status === BudgetStatus.ACEITO && budget.sale ? (
        <p className="text-sm">
          Venda vinculada:{" "}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              saleFinalized ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {saleFinalized ? "Finalizada" : "Pendente"}
          </span>
          {budget.sale.paidAt ? (
            <span className="text-muted-foreground">
              {" "}
              · finalizada em {budget.sale.paidAt.toLocaleDateString("pt-BR")}
            </span>
          ) : null}
        </p>
      ) : null}

      {/* Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens ({budget.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {budget.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatQuantity(Number(item.quantity))} × {formatCents(item.unitPriceCents)}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums">{formatCents(item.totalCents)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-bold tabular-nums">{formatCents(budget.totalCents)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Validade:</span>{" "}
            {budget.validUntil ? budget.validUntil.toLocaleDateString("pt-BR") : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Enviado em:</span>{" "}
            {budget.sentAt ? budget.sentAt.toLocaleDateString("pt-BR") : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Respondido em:</span>{" "}
            {budget.respondedAt ? budget.respondedAt.toLocaleDateString("pt-BR") : "—"}
          </p>
          {budget.note ? (
            <p className="whitespace-pre-wrap pt-2">
              <span className="text-muted-foreground">Observações:</span> {budget.note}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Link href="/vendedor/orcamentos" className="text-sm text-primary hover:underline">
        ← Voltar para orçamentos
      </Link>
    </div>
  );
}
