import Link from "next/link";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { listPriceItems } from "@/server/services/price-items";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/money";
import { UNIT_LABEL, type BudgetUnit } from "@/lib/budget-math";
import { togglePriceItemAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TabelaPrecosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; inativos?: string }>;
}) {
  await requireUser(STAFF_ROLES);
  const { q, inativos } = await searchParams;
  const search = q?.trim() || undefined;
  const includeInactive = inativos === "1";

  const items = await listPriceItems({ search, includeInactive });
  const semPreco = items.filter((i) => i.priceCents === 0).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tabela de preços</h1>
          <p className="text-muted-foreground">
            Base do orçamento: o vendedor busca estes produtos por código ou nome.
          </p>
        </div>
        <Link href="/admin/tabela-precos/novo" className={buttonVariants({ className: "w-fit" })}>
          Novo produto
        </Link>
      </header>

      {semPreco > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              {semPreco} produto{semPreco === 1 ? "" : "s"} sem preço definido (R$ 0,00). Eles
              aparecem na busca marcados como &quot;preço a definir&quot; e o vendedor digita o
              valor no orçamento.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Produtos ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="flex max-w-xl flex-wrap gap-2">
            <Input
              name="q"
              placeholder="Buscar por código ou descrição"
              defaultValue={q ?? ""}
              className="min-w-[200px] flex-1"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="inativos"
                value="1"
                defaultChecked={includeInactive}
                className="h-4 w-4"
              />
              Mostrar inativos
            </label>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhum produto encontrado." : "A tabela de preços está vazia."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2 font-semibold">Código</th>
                    <th className="py-2 pr-2 font-semibold">Descrição</th>
                    <th className="py-2 pr-2 font-semibold">Unidade</th>
                    <th className="py-2 pr-2 text-right font-semibold">Valor</th>
                    <th className="py-2 pr-2 font-semibold">Grupo</th>
                    <th className="py-2 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className={item.active ? "" : "opacity-50"}>
                      <td className="py-2 pr-2 font-mono text-xs">{item.code}</td>
                      <td className="py-2 pr-2">{item.description}</td>
                      <td className="py-2 pr-2 text-xs">{UNIT_LABEL[item.unit as BudgetUnit]}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {item.priceCents > 0 ? (
                          <>
                            {formatCents(item.priceCents)}
                            {item.unit === "M2" ? "/m²" : ""}
                          </>
                        ) : (
                          <span className="text-amber-600">a definir</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-xs text-muted-foreground">
                        {item.group ?? "—"}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/tabela-precos/${item.id}/editar`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Editar
                          </Link>
                          <form action={togglePriceItemAction}>
                            <input type="hidden" name="priceItemId" value={item.id} />
                            <input type="hidden" name="active" value={item.active ? "0" : "1"} />
                            <button
                              type="submit"
                              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                            >
                              {item.active ? "Desativar" : "Ativar"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atualizar em massa pela planilha</CardTitle>
          <CardDescription>
            Para um reajuste geral, edite a planilha <code>Orçamento_pedido/produtos.html</code> e
            rode <code>pnpm --filter @cleci/db seed:precos</code>. O importador atualiza descrição,
            unidade e valor por código, preservando os produtos criados aqui.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
