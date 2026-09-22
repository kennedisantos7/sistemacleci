import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BudgetStatus, SaleStatus, type BudgetDocType } from "@cleci/db";
import { FileDown, Pencil } from "lucide-react";
import { requireUser } from "@/server/session";
import { getBudgetForActor, isBudgetOverdue } from "@/server/services/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DraftLeaveGuard } from "@/components/draft-leave-guard";
import { formatCents, formatQuantity, formatDecimal } from "@/lib/money";
import { UNIT_LABEL, type BudgetUnit } from "@/lib/budget-math";
import { BUDGET_VIEW_ROLES, canSeeAllBudgets } from "@/lib/rbac";
import { DOC_TYPE_LABEL, docPath } from "@/lib/doc-type";
import {
  sendBudgetAction,
  revertBudgetAction,
  acceptBudgetAction,
  rejectBudgetAction,
  reopenBudgetAction,
  finalizeBudgetSaleAction,
  deleteBudgetAction,
  convertToPedidoAction,
} from "./actions";
import { BUDGET_STATUS_LABEL, BUDGET_STATUS_STYLE } from "@/lib/budget-status";

/**
 * Detalhe de um documento. A mesma tela serve às duas seções; `section` é a
 * seção pela qual se chegou — se não bater com o tipo real (link antigo, ou
 * orçamento recém-convertido), manda para a seção certa em vez de dar 404.
 */
export async function DocumentDetail({
  id,
  section,
}: {
  id: string;
  section: BudgetDocType;
}) {
  const user = await requireUser(BUDGET_VIEW_ROLES);

  const budget = await getBudgetForActor(user, id);
  if (!budget) notFound();
  if (budget.docType !== section) redirect(docPath(budget.docType, budget.id));

  const overdue = isBudgetOverdue(budget);
  const saleFinalized = budget.sale?.status === SaleStatus.PAGO;
  const docLabel = DOC_TYPE_LABEL[budget.docType];
  const seesAll = canSeeAllBudgets(user.role);
  const base = docPath(budget.docType);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {docLabel} #{budget.number}
            {budget.title ? <span className="text-muted-foreground"> — {budget.title}</span> : null}
          </h1>
          <p className="text-muted-foreground">
            {budget.client.name}
            {budget.client.companyName ? ` · ${budget.client.companyName}` : ""} · criado em{" "}
            {budget.createdAt.toLocaleDateString("pt-BR")}
            {seesAll ? ` · ${budget.vendedor.name ?? budget.vendedor.email}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Rosa, não âmbar: âmbar agora é o "Pendente". */}
          {overdue ? (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
              Vencido
            </span>
          ) : null}
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${BUDGET_STATUS_STYLE[budget.status]}`}
          >
            {BUDGET_STATUS_LABEL[budget.status]}
          </span>
        </div>
      </header>

      {/* Se o documento ainda está em rascunho, avisa antes de sair da tela
          sem enviar para o cliente (fechar/atualizar a aba ou clicar em
          qualquer link de navegação). */}
      {budget.status === BudgetStatus.RASCUNHO && (
        <DraftLeaveGuard
          message={`Este ${docLabel.toLowerCase()} ainda não foi enviado para o cliente. Se sair agora, ele fica parado como rascunho. Deseja sair mesmo assim?`}
        />
      )}

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sem target="_blank": a rota responde com Content-Disposition
            attachment, então o arquivo baixa direto. Abrir aba nova só deixava
            uma aba em branco no celular. */}
        <a
          href={`/api/orcamentos/${budget.id}/pdf`}
          download
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <FileDown className="h-4 w-4" /> Baixar PDF
        </a>

        {/* Converter é caminho de mão única — o aviso está na confirmação. */}
        {budget.docType === "ORCAMENTO" && (
          <ConfirmSubmitButton
            action={convertToPedidoAction}
            hidden={{ budgetId: budget.id }}
            label="Converter em pedido"
            pendingLabel="Convertendo..."
            variant="outline"
            confirmMessage="Converter este orçamento em pedido? Ele sai da seção Orçamentos e passa para Pedidos, e o PDF passa a sair completo, com dados da empresa, cláusulas e assinatura. Um pedido não volta a ser orçamento."
          />
        )}

        {budget.status === BudgetStatus.RASCUNHO && (
          <>
            <Link
              href={`${base}/${budget.id}/editar`}
              data-skip-leave-guard=""
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="h-4 w-4" /> Editar
            </Link>
            <ConfirmSubmitButton
              action={sendBudgetAction}
              hidden={{ budgetId: budget.id }}
              label="Marcar como enviado"
              pendingLabel="Enviando..."
              variant="default"
              size="lg"
              className="bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700"
              confirmMessage={`Marcar como enviado? O ${docLabel.toLowerCase()} não poderá mais ser editado (só voltando para rascunho).`}
            />
            {/* Limpeza de rascunhos: só admin/desenvolvedor/gerente. Rascunho
                não tem venda vinculada, então nada de histórico se perde. */}
            {seesAll && (
              <ConfirmSubmitButton
                action={deleteBudgetAction}
                hidden={{ budgetId: budget.id }}
                label="Excluir rascunho"
                pendingLabel="Excluindo..."
                variant="destructive"
                confirmMessage={`Excluir o rascunho #${budget.number}${budget.title ? ` (${budget.title})` : ""}? Essa ação não pode ser desfeita.`}
              />
            )}
          </>
        )}

        {budget.status === BudgetStatus.ENVIADO && (
          <>
            <ConfirmSubmitButton
              action={acceptBudgetAction}
              hidden={{ budgetId: budget.id }}
              label="Cliente aceitou"
              pendingLabel="Registrando..."
              variant="default"
              size="lg"
              className="bg-green-600 font-semibold text-white shadow-sm hover:bg-green-700"
              confirmMessage="Registrar o aceite do cliente? Isso cria a venda correspondente."
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

        {/* Recusado não é ponto final: o cliente pode voltar atrás, e a recusa
            pode ter sido clique errado. Daqui dá para registrar o aceite (que
            cria a venda, igual ao caminho normal) ou voltar para pendente. */}
        {budget.status === BudgetStatus.RECUSADO && (
          <>
            <ConfirmSubmitButton
              action={acceptBudgetAction}
              hidden={{ budgetId: budget.id }}
              label="Cliente aceitou"
              pendingLabel="Registrando..."
              variant="default"
              size="lg"
              className="bg-green-600 font-semibold text-white shadow-sm hover:bg-green-700"
              confirmMessage="O cliente voltou atrás e aceitou? Isso tira o documento de recusado e cria a venda correspondente."
            />
            <form action={reopenBudgetAction}>
              <input type="hidden" name="budgetId" value={budget.id} />
              <button
                type="submit"
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                Voltar para pendente
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
            variant="default"
            size="lg"
            className="bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-2 font-semibold">Código</th>
                  <th className="py-2 pr-2 font-semibold">Descrição</th>
                  <th className="py-2 pr-2 text-right font-semibold">Base cálc.</th>
                  <th className="py-2 pr-2 font-semibold">Un.</th>
                  <th className="py-2 pr-2 text-right font-semibold">M²</th>
                  <th className="py-2 pr-2 text-right font-semibold">Valor unit.</th>
                  <th className="py-2 pr-2 text-right font-semibold">Qtd</th>
                  <th className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {budget.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-2 font-mono text-xs text-muted-foreground">
                      {item.code ?? "—"}
                    </td>
                    <td className="py-2 pr-2">
                      <span className="whitespace-pre-wrap">{item.description}</span>
                      {item.widthM && item.lengthM ? (
                        <span className="block text-xs text-muted-foreground">
                          {formatDecimal(Number(item.widthM), 3)} ×{" "}
                          {formatDecimal(Number(item.lengthM), 3)} m
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {formatCents(item.unitPriceCents)}
                    </td>
                    <td className="py-2 pr-2 text-xs">{UNIT_LABEL[item.unit as BudgetUnit]}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {item.areaM2 ? formatDecimal(Number(item.areaM2), 4) : "—"}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {formatCents(item.partialCents)}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {formatQuantity(Number(item.quantity))}
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums">
                      {formatCents(item.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="ml-auto mt-4 w-full max-w-sm space-y-1 border-t border-border pt-3 text-sm">
            <TotalLine label="Valor total do pedido" cents={budget.subtotalCents} />
            {budget.discountCents > 0 ? (
              <TotalLine label="Desconto" cents={-budget.discountCents} />
            ) : null}
            {budget.surchargeCents > 0 ? (
              <TotalLine label="Adicional" cents={budget.surchargeCents} />
            ) : null}
            {budget.freightCents > 0 ? (
              <TotalLine label="Frete" cents={budget.freightCents} />
            ) : null}
            {budget.taxCents > 0 ? <TotalLine label="Imposto" cents={budget.taxCents} /> : null}
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-semibold">Total final</span>
              <span className="text-xl font-bold tabular-nums">
                {formatCents(budget.totalCents)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm sm:grid-cols-2">
          <Info label="Condição de pagamento" value={budget.paymentTerms} />
          <Info label="Previsão de entrega" value={budget.deliveryForecast} />
          <Info label="Cidade de entrega" value={budget.deliveryCity} />
          <Info
            label="Validade"
            value={budget.validUntil ? budget.validUntil.toLocaleDateString("pt-BR") : null}
          />
          <Info
            label="Enviado em"
            value={budget.sentAt ? budget.sentAt.toLocaleDateString("pt-BR") : null}
          />
          <Info
            label="Respondido em"
            value={budget.respondedAt ? budget.respondedAt.toLocaleDateString("pt-BR") : null}
          />
          {budget.note ? (
            <p className="whitespace-pre-wrap pt-2 sm:col-span-2">
              <span className="text-muted-foreground">Observações:</span> {budget.note}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Link href={base} className="text-sm text-primary hover:underline">
        ← Voltar para {budget.docType === "PEDIDO" ? "pedidos" : "orçamentos"}
      </Link>
    </div>
  );
}

function TotalLine({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{formatCents(cents)}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <p className="min-w-0 break-words">
      <span className="text-muted-foreground">{label}:</span> {value || "—"}
    </p>
  );
}
