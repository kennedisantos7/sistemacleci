import Link from "next/link";
import { BudgetStatus, SaleStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { isBudgetOverdue, listBudgetsForActor } from "@/server/services/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { BUDGET_ROLES, canSeeAllBudgets } from "@/lib/rbac";

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

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Todos" },
  { value: "RASCUNHO", label: "Rascunhos" },
  { value: "ENVIADO", label: "Enviados" },
  { value: "ACEITO", label: "Aceitos" },
  { value: "RECUSADO", label: "Recusados" },
];

function isBudgetStatus(v: string): v is BudgetStatus {
  return v in STATUS_LABEL;
}

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser(BUDGET_ROLES);
  const { status } = await searchParams;
  const statusFilter = status && isBudgetStatus(status) ? status : undefined;
  const seesAll = canSeeAllBudgets(user.role);

  const budgets = await listBudgetsForActor(user, { status: statusFilter, take: 50 });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos e pedidos</h1>
          <p className="text-muted-foreground">
            {seesAll
              ? "Acompanhe os orçamentos de toda a equipe e o andamento das vendas."
              : "Acompanhe seus orçamentos e o andamento das vendas."}
          </p>
        </div>
        <Link href="/orcamentos/novo" className={buttonVariants({ className: "w-fit" })}>
          Novo orçamento
        </Link>
      </header>

      {/* Filtro por status */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (statusFilter ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/orcamentos?status=${f.value}` : "/orcamentos"}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground/70 hover:bg-muted/80"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter ? STATUS_LABEL[statusFilter] : "Todos"} ({budgets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {statusFilter
                ? "Nenhum orçamento com este status."
                : seesAll
                  ? "Nenhum orçamento criado ainda."
                  : "Você ainda não criou orçamentos."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {budgets.map((b) => {
                const overdue = isBudgetOverdue(b);
                const saleLabel =
                  b.sale == null
                    ? "—"
                    : b.sale.status === SaleStatus.PAGO
                      ? "Finalizada"
                      : "Pendente";
                return (
                  <Link
                    key={b.id}
                    href={`/orcamentos/${b.id}`}
                    className="flex flex-col gap-1 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:px-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {b.docType === "PEDIDO" ? "Pedido" : "Orçamento"} #{b.number} ·{" "}
                        {b.client.name}
                        {b.title ? (
                          <span className="text-muted-foreground"> — {b.title}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCents(b.totalCents)} · {b._count.items} ite
                        {b._count.items === 1 ? "m" : "ns"} ·{" "}
                        {b.createdAt.toLocaleDateString("pt-BR")}
                        {b.sale ? ` · venda: ${saleLabel}` : ""}
                        {/* Quem vê a equipe inteira precisa saber de quem é o orçamento. */}
                        {seesAll ? ` · ${b.vendedor.name ?? b.vendedor.email}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {overdue ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Vencido
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[b.status]}`}
                      >
                        {STATUS_LABEL[b.status]}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
