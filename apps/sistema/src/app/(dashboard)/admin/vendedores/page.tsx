import Link from "next/link";
import { UserStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { getSalesTeamOverview, type SellerRow } from "@/server/services/sales-team";
import { resolverPeriodo } from "@/lib/date-range";
import { PeriodFilter } from "@/components/period-filter";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminVendedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  await requireUser(STAFF_ROLES);
  const range = resolverPeriodo(await searchParams);
  const { vendedores, totais } = await getSalesTeamOverview(range);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Painel de vendas</h1>
        <p className="text-muted-foreground">
          Resultado de cada vendedor no período. Clique num nome para abrir o painel completo dele.
        </p>
      </header>

      <PeriodFilter range={range} basePath="/admin/vendedores" />

      {/* --- Total da equipe --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vendas da equipe"
          value={formatCents(totais.vendasCents)}
          hint={`${totais.quantidade} venda${totais.quantidade === 1 ? "" : "s"} finalizada${totais.quantidade === 1 ? "" : "s"}`}
        />
        <StatCard
          title="Ticket médio"
          value={formatCents(totais.ticketMedioCents)}
          hint={`${totais.vendedores} vendedor${totais.vendedores === 1 ? "" : "es"} no time`}
        />
        <StatCard
          title="Em negociação"
          value={formatCents(totais.emNegociacaoCents)}
          hint={`${totais.orcamentosCriados} orçamento${totais.orcamentosCriados === 1 ? "" : "s"} criado${totais.orcamentosCriados === 1 ? "" : "s"} no período`}
        />
        <StatCard
          title="Conversão da equipe"
          value={totais.conversao === null ? "—" : `${totais.conversao}%`}
          hint={
            totais.conversao === null
              ? "Nenhum orçamento respondido no período"
              : `${formatCents(totais.comissaoCents)} em comissão sobre o período`
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendedores ({vendedores.length})</CardTitle>
          <CardDescription>
            Ordenado por faturamento no período. A meta é sempre a do mês corrente — ela não
            acompanha o filtro acima.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendedores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum vendedor cadastrado.{" "}
              <Link href="/admin/usuarios" className="text-primary hover:underline">
                Criar um login de vendedor →
              </Link>
            </p>
          ) : (
            <>
              {/* Celular: cartões. A tabela abaixo é a mesma informação, mas só
                  faz sentido com largura para as sete colunas. */}
              <div className="space-y-3 lg:hidden">
                {vendedores.map((v, i) => (
                  <CartaoVendedor key={v.id} v={v} posicao={i + 1} range={range.preset} />
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-2 font-semibold">#</th>
                      <th className="py-2 pr-2 font-semibold">Vendedor</th>
                      <th className="py-2 pr-2 text-right font-semibold">Vendas</th>
                      <th className="py-2 pr-2 text-right font-semibold">Ticket médio</th>
                      <th className="py-2 pr-2 text-right font-semibold">Orçamentos</th>
                      <th className="py-2 pr-2 text-right font-semibold">Conversão</th>
                      <th className="py-2 pr-2 text-right font-semibold">Em negociação</th>
                      <th className="py-2 pr-2 font-semibold">Meta do mês</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vendedores.map((v, i) => (
                      <tr
                        key={v.id}
                        className={v.status === UserStatus.ATIVO ? "" : "opacity-60"}
                      >
                        <td className="py-3 pr-2 text-xs text-muted-foreground">{i + 1}º</td>
                        <td className="py-3 pr-2">
                          <Link
                            href={perfilHref(v.id, range.preset)}
                            className="font-medium text-primary hover:underline"
                          >
                            {v.nome}
                          </Link>
                          <span className="block text-xs text-muted-foreground">
                            {v.email}
                            {v.status === UserStatus.ATIVO ? "" : ` · ${rotuloStatus(v.status)}`}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <span className="block font-semibold tabular-nums">
                            {formatCents(v.vendas.totalCents)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {v.vendas.quantidade} venda{v.vendas.quantidade === 1 ? "" : "s"}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums">
                          {formatCents(v.vendas.ticketMedioCents)}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <span className="block tabular-nums">{v.orcamentos.criados}</span>
                          <span className="text-xs text-muted-foreground">
                            {v.orcamentos.aceitos} aceitos · {v.orcamentos.enviados} aguardando
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums">
                          {v.orcamentos.conversao === null ? "—" : `${v.orcamentos.conversao}%`}
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums">
                          {formatCents(v.orcamentos.emNegociacaoCents)}
                        </td>
                        <td className="w-40 py-3 pr-2">
                          <MetaCelula v={v} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/metas" className="text-primary hover:underline">
          Definir metas →
        </Link>
        <Link href="/admin/vendas" className="text-primary hover:underline">
          Ver todas as vendas →
        </Link>
        <Link href="/orcamentos" className="text-primary hover:underline">
          Ver orçamentos da equipe →
        </Link>
      </div>
    </div>
  );
}

/** O período escolhido segue para o perfil — o admin não refiltra ao entrar. */
function perfilHref(id: string, preset: string): string {
  return `/admin/vendedores/${id}?periodo=${preset}`;
}

function rotuloStatus(status: UserStatus): string {
  return status === UserStatus.BLOQUEADO ? "bloqueado" : "pendente";
}

function MetaCelula({ v }: { v: SellerRow }) {
  if (v.meta.targetCents === 0) {
    return <span className="text-xs text-muted-foreground">sem meta definida</span>;
  }
  return (
    <div className="space-y-1">
      <ProgressBar percent={v.meta.percent} />
      <span className="block text-xs text-muted-foreground">
        {v.meta.percent}% de {formatCents(v.meta.targetCents)}
      </span>
    </div>
  );
}

function CartaoVendedor({
  v,
  posicao,
  range,
}: {
  v: SellerRow;
  posicao: number;
  range: string;
}) {
  return (
    <Link
      href={perfilHref(v.id, range)}
      className={`block rounded-lg border border-border p-3 hover:bg-muted/50 ${
        v.status === UserStatus.ATIVO ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            <span className="text-muted-foreground">{posicao}º</span> {v.nome}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {v.orcamentos.criados} orçamento{v.orcamentos.criados === 1 ? "" : "s"} ·{" "}
            {v.orcamentos.conversao === null ? "sem resposta" : `${v.orcamentos.conversao}% conversão`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block font-semibold tabular-nums">
            {formatCents(v.vendas.totalCents)}
          </span>
          <span className="text-xs text-muted-foreground">
            {v.vendas.quantidade} venda{v.vendas.quantidade === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      {v.meta.targetCents > 0 ? (
        <div className="mt-2 space-y-1">
          <ProgressBar percent={v.meta.percent} />
          <span className="block text-xs text-muted-foreground">
            meta do mês: {v.meta.percent}% de {formatCents(v.meta.targetCents)}
          </span>
        </div>
      ) : null}
    </Link>
  );
}
