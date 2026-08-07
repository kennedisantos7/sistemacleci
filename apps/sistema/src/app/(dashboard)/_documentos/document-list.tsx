import Link from "next/link";
import { BudgetStatus, type BudgetDocType } from "@cleci/db";
import { requireUser } from "@/server/session";
import { isBudgetOverdue, listBudgetsForActor } from "@/server/services/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { BUDGET_ROLES, canSeeAllBudgets } from "@/lib/rbac";
import { BUDGET_STATUS_LABEL, BUDGET_STATUS_STYLE, isBudgetStatus } from "@/lib/budget-status";
import { SALE_STATUS_LABEL } from "@/lib/sale-status";
import { DOC_TYPE_LABEL, docPath } from "@/lib/doc-type";
import { DeleteDraftButton } from "./delete-draft-button";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Todos" },
  { value: "RASCUNHO", label: "Rascunhos" },
  { value: "ENVIADO", label: "Pendentes" },
  { value: "ACEITO", label: "Aceitos" },
  { value: "RECUSADO", label: "Recusados" },
];

/** Textos que mudam entre as duas seções. */
const COPY: Record<BudgetDocType, { subtituloEquipe: string; subtituloProprio: string }> = {
  ORCAMENTO: {
    subtituloEquipe: "Propostas de toda a equipe. Um orçamento aceito pode virar pedido.",
    subtituloProprio: "Suas propostas. Um orçamento aceito pode virar pedido.",
  },
  PEDIDO: {
    subtituloEquipe: "Pedidos fechados de toda a equipe e o andamento das vendas.",
    subtituloProprio: "Seus pedidos fechados e o andamento das vendas.",
  },
};

/**
 * Lista de uma das seções (orçamentos ou pedidos). São documentos diferentes —
 * ver lib/doc-type.ts — e cada um tem sua entrada no menu.
 */
export async function DocumentList({
  docType,
  searchParams,
}: {
  docType: BudgetDocType;
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser(BUDGET_ROLES);
  const { status } = await searchParams;
  const statusFilter = status && isBudgetStatus(status) ? status : undefined;
  const seesAll = canSeeAllBudgets(user.role);
  const base = docPath(docType);
  const label = DOC_TYPE_LABEL[docType];
  const copy = COPY[docType];

  const budgets = await listBudgetsForActor(user, { status: statusFilter, docType, take: 50 });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{docType === "PEDIDO" ? "Pedidos" : "Orçamentos"}</h1>
          <p className="text-muted-foreground">
            {seesAll ? copy.subtituloEquipe : copy.subtituloProprio}
          </p>
        </div>
        <Link href={`${base}/novo`} className={buttonVariants({ className: "w-fit" })}>
          Novo {label.toLowerCase()}
        </Link>
      </header>

      {/* Filtro por status */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (statusFilter ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `${base}?status=${f.value}` : base}
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
            {statusFilter ? BUDGET_STATUS_LABEL[statusFilter] : "Todos"} ({budgets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {statusFilter
                ? `Nenhum ${label.toLowerCase()} com este status.`
                : seesAll
                  ? `Nenhum ${label.toLowerCase()} criado ainda.`
                  : `Você ainda não criou ${docType === "PEDIDO" ? "pedidos" : "orçamentos"}.`}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {budgets.map((b) => {
                const overdue = isBudgetOverdue(b);
                const saleLabel = b.sale == null ? "—" : SALE_STATUS_LABEL[b.sale.status];
                // Limpeza de rascunhos: só admin/desenvolvedor/gerente, e só
                // enquanto for rascunho (não há venda vinculada a perder).
                const podeExcluir = seesAll && b.status === BudgetStatus.RASCUNHO;
                return (
                  // Linha em <div>, não <Link>: o botão de excluir não pode
                  // ficar dentro de uma âncora (HTML inválido e o clique
                  // navegaria em vez de excluir).
                  <div
                    key={b.id}
                    className="flex flex-col gap-1 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:px-2"
                  >
                    <Link href={docPath(b.docType, b.id)} className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        #{b.number} · {b.client.name}
                        {b.title ? (
                          <span className="text-muted-foreground"> — {b.title}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCents(b.totalCents)} · {b._count.items} ite
                        {b._count.items === 1 ? "m" : "ns"} ·{" "}
                        {b.createdAt.toLocaleDateString("pt-BR")}
                        {b.sale ? ` · venda: ${saleLabel}` : ""}
                        {/* Quem vê a equipe inteira precisa saber de quem é o documento. */}
                        {seesAll ? ` · ${b.vendedor.name ?? b.vendedor.email}` : ""}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Rosa, não âmbar: âmbar agora é o "Pendente" e os dois
                          selos aparecem lado a lado. */}
                      {overdue ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          Vencido
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${BUDGET_STATUS_STYLE[b.status]}`}
                      >
                        {BUDGET_STATUS_LABEL[b.status]}
                      </span>
                      {podeExcluir ? (
                        <DeleteDraftButton
                          budgetId={b.id}
                          label={`#${b.number}${b.title ? ` — ${b.title}` : ""}`}
                        />
                      ) : null}
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
