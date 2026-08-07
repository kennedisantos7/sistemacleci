import Link from "next/link";
import { requireUser } from "@/server/session";
import { getSellerDashboard } from "@/server/services/seller-dashboard";
import { resolverPeriodo } from "@/lib/date-range";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, bpsToPercent } from "@/lib/money";
import { PeriodFilter } from "./period-filter";
import { SalesChart } from "./sales-chart";
import { BUDGET_STATUS_LABEL } from "@/lib/budget-status";
import { docPath } from "@/lib/doc-type";

export const dynamic = "force-dynamic";

export default async function VendedorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const params = await searchParams;
  const range = resolverPeriodo(params);
  const d = await getSellerDashboard(user.id, range);

  const metaRestante = Math.max(0, d.meta.targetCents - d.meta.achievedCents);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Meu painel</h1>
        <p className="text-muted-foreground">
          Vendas, comissão e carteira — filtre pelo período que quiser acompanhar.
        </p>
      </header>

      <PeriodFilter range={range} basePath="/vendedor" />

      {/* --- Resultado do período --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vendas no período"
          value={formatCents(d.vendas.totalCents)}
          hint={`${d.vendas.quantidade} venda${d.vendas.quantidade === 1 ? "" : "s"} finalizada${d.vendas.quantidade === 1 ? "" : "s"}`}
        />
        <StatCard
          title="Comissão a receber"
          value={d.comissao.configurada ? formatCents(d.comissao.totalCents) : "—"}
          hint={
            d.comissao.configurada
              ? `${bpsToPercent(d.comissao.rateBps)} sobre as vendas do período`
              : "Percentual ainda não definido — fale com o administrador"
          }
        />
        <StatCard
          title="Ticket médio"
          value={formatCents(d.vendas.ticketMedioCents)}
          hint="Valor médio por venda fechada"
        />
        <StatCard
          title="Taxa de conversão"
          value={d.orcamentos.conversao === null ? "—" : `${d.orcamentos.conversao}%`}
          hint={
            d.orcamentos.conversao === null
              ? "Nenhum orçamento respondido ainda"
              : `${d.orcamentos.aceitos} aceitos de ${d.orcamentos.aceitos + d.orcamentos.recusados} respondidos`
          }
        />
      </div>

      {/* Comissão paga por fora: deixa explícito para não virar cobrança errada. */}
      {d.comissao.configurada ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          A comissão é calculada a {bpsToPercent(d.comissao.rateBps)}
          {d.comissao.individual ? " (percentual individual)" : " (padrão da equipe)"} sobre as
          vendas finalizadas e <strong>paga fora da plataforma</strong>. O valor aqui é para
          acompanhamento — o pagamento não é solicitado pelo sistema.
          {d.comissao.potencialCents > 0 ? (
            <>
              {" "}
              Há mais {formatCents(d.comissao.potencialCents)} em comissão nos orçamentos ainda
              aguardando resposta.
            </>
          ) : null}
        </p>
      ) : null}

      {/* --- Funil e carteira --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Orçamentos criados"
          value={String(d.orcamentos.criados)}
          hint={`${d.orcamentos.rascunhos} em rascunho`}
        />
        <StatCard
          title="Aguardando resposta"
          value={String(d.orcamentos.enviados)}
          hint={`${formatCents(d.orcamentos.emNegociacaoCents)} em negociação`}
        />
        <StatCard
          title="Clientes ativos"
          value={String(d.carteira.ativos)}
          hint={`${d.carteira.novosNoPeriodo} novo${d.carteira.novosNoPeriodo === 1 ? "" : "s"} no período`}
        />
        <StatCard
          title="Vendas pendentes"
          value={String(d.vendas.pendentesQuantidade)}
          hint={`${formatCents(d.vendas.pendentesCents)} a finalizar`}
        />
      </div>

      {/* Alerta acionável: a titularidade destas empresas está para vencer. */}
      {d.carteira.liberandoEmBreve > 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>
            {d.carteira.liberandoEmBreve} empresa
            {d.carteira.liberandoEmBreve === 1 ? "" : "s"} da sua carteira
          </strong>{" "}
          {d.carteira.liberandoEmBreve === 1 ? "fica livre" : "ficam livres"} para outros vendedores
          em até {d.carteira.diasAlerta} dias sem atividade sua.{" "}
          <Link href="/clientes?filtro=minhas" className="font-medium underline">
            Ver minha carteira →
          </Link>
        </div>
      ) : null}

      {/* --- Evolução --- */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução das vendas</CardTitle>
          <CardDescription>Valor finalizado por dia · {range.label}</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart dados={d.evolucao} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* --- Meta do mês (sempre o mês corrente, independente do filtro) --- */}
        <Card>
          <CardHeader>
            <CardTitle>Meta do mês</CardTitle>
            <CardDescription>
              Sempre o mês atual — não acompanha o filtro de período.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.meta.targetCents === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma meta definida para este mês. Fale com o administrador.
              </p>
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{formatCents(d.meta.achievedCents)}</span>
                  <span className="text-sm text-muted-foreground">
                    meta {formatCents(d.meta.targetCents)} · {d.meta.percent}%
                  </span>
                </div>
                <ProgressBar percent={d.meta.percent} />
                <p className="text-xs text-muted-foreground">
                  {d.meta.percent >= 100
                    ? "Meta batida! 🎉"
                    : `Faltam ${formatCents(metaRestante)} para bater a meta.`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* --- Melhores clientes do período --- */}
        <Card>
          <CardHeader>
            <CardTitle>Melhores clientes do período</CardTitle>
            <CardDescription>Por valor comprado.</CardDescription>
          </CardHeader>
          <CardContent>
            {d.topClientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma venda com cliente vinculado neste período.
              </p>
            ) : (
              <ol className="divide-y divide-border">
                {d.topClientes.map((c, i) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="w-5 shrink-0 text-sm text-muted-foreground">{i + 1}º</span>
                      <Link
                        href={`/clientes/${c.id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {c.nome}
                      </Link>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold">
                        {formatCents(c.totalCents)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c.vendas} venda{c.vendas === 1 ? "" : "s"}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- Últimos orçamentos --- */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos orçamentos</CardTitle>
          <CardDescription>Os 5 mais recentes, de qualquer período.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {d.orcamentosRecentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não criou orçamentos.</p>
          ) : (
            <div className="divide-y divide-border">
              {d.orcamentosRecentes.map((b) => (
                <Link
                  key={b.id}
                  href={docPath(b.docType, b.id)}
                  className="flex items-center justify-between gap-3 py-2.5 hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {b.docType === "PEDIDO" ? "Pedido" : "Orçamento"} #{b.number}
                      {b.title ? ` — ${b.title}` : ""}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {b.client.companyName ?? b.client.name} ·{" "}
                      {b.createdAt.toLocaleDateString("pt-BR")} · {BUDGET_STATUS_LABEL[b.status]}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatCents(b.totalCents)}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/orcamentos" className="text-primary hover:underline">
              Ver todos os orçamentos →
            </Link>
            <Link href="/pedidos" className="text-primary hover:underline">
              Ver pedidos →
            </Link>
            <Link href="/clientes" className="text-primary hover:underline">
              Ver clientes →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
