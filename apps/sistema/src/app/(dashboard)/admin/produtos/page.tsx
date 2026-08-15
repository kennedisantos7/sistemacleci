import Link from "next/link";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { listPriceItems, type PriceItemListFilters } from "@/server/services/price-items";
import { listCategoriesWithSubs } from "@/server/services/products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/money";
import { UNIT_LABEL, type BudgetUnit } from "@/lib/budget-math";
import { togglePriceItemAction, toggleSiteAction } from "./actions";

export const dynamic = "force-dynamic";

const SELECT_CLASS =
  "h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/**
 * Seção Produtos: o cadastro único que alimenta o orçamento e, quando a chave
 * está ligada, a vitrine do site. Uma linha por código — é assim que o vendedor
 * busca o produto ao montar o documento.
 */
export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; inativos?: string; categoria?: string; site?: string }>;
}) {
  await requireUser(FULL_ACCESS_ROLES);
  const { q, inativos, categoria, site } = await searchParams;

  const search = q?.trim() || undefined;
  const includeInactive = inativos === "1";
  const filtroSite: PriceItemListFilters["site"] =
    site === "no-site" ? "no-site" : site === "fora" ? "fora" : undefined;

  const [items, categorias] = await Promise.all([
    listPriceItems({ search, includeInactive, categoryId: categoria || undefined, site: filtroSite }),
    listCategoriesWithSubs(),
  ]);

  const semPreco = items.filter((i) => i.priceCents === 0).length;
  const semFoto = items.filter((i) => !i.imageUrl).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Base do orçamento e do site: o vendedor busca estes produtos por código ou nome.
          </p>
        </div>
        <Link href="/admin/produtos/novo" className={buttonVariants({ className: "w-fit" })}>
          Novo produto
        </Link>
      </header>

      {semPreco > 0 || semFoto > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              {semPreco > 0 ? (
                <>
                  {semPreco} produto{semPreco === 1 ? "" : "s"} sem preço definido (R$ 0,00) —
                  aparecem na busca como &quot;preço a definir&quot; e o vendedor digita o valor no
                  orçamento.{" "}
                </>
              ) : null}
              {semFoto > 0 ? (
                <>
                  {semFoto} sem foto: {semFoto === 1 ? "esse não sai" : "esses não saem"} com imagem
                  no PDF nem {semFoto === 1 ? "pode" : "podem"} ir para o site.
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Produtos ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="flex flex-wrap gap-2">
            <Input
              name="q"
              placeholder="Buscar por código ou descrição"
              defaultValue={q ?? ""}
              className="min-w-[200px] flex-1"
            />
            <select name="categoria" defaultValue={categoria ?? ""} className={SELECT_CLASS}>
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select name="site" defaultValue={site ?? ""} className={SELECT_CLASS}>
              <option value="">No site e fora dele</option>
              <option value="no-site">Só os que estão no site</option>
              <option value="fora">Só os que não estão</option>
            </select>
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
              {search || categoria || site
                ? "Nenhum produto encontrado."
                : "Nenhum produto cadastrado ainda."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2 font-semibold">Foto</th>
                    <th className="py-2 pr-2 font-semibold">Código</th>
                    <th className="py-2 pr-2 font-semibold">Descrição</th>
                    <th className="py-2 pr-2 font-semibold">Unidades e valores</th>
                    <th className="py-2 pr-2 font-semibold">Categoria</th>
                    <th className="py-2 pr-2 font-semibold">Site</th>
                    <th className="py-2 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const noSite = Boolean(item.siteProduct?.active);
                    const podeSubir = Boolean(item.imageUrl && item.categoryId);
                    return (
                      <tr key={item.id} className={item.active ? "" : "opacity-50"}>
                        <td className="py-2 pr-2">
                          {item.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-10 w-10 rounded-md border border-border object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                              sem
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-2 font-mono text-xs">{item.code}</td>
                        <td className="py-2 pr-2">{item.description}</td>
                        {/* Um produto pode ter valor em mais de uma unidade; a
                            principal (a pré-selecionada no orçamento) vem em negrito. */}
                        <td className="py-2 pr-2 text-xs">
                          <div className="flex flex-col gap-0.5">
                            {item.prices.map((p) => (
                              <span
                                key={p.unit}
                                className={p.unit === item.unit ? "font-semibold" : ""}
                              >
                                {UNIT_LABEL[p.unit as BudgetUnit]}:{" "}
                                {p.priceCents > 0 ? (
                                  <span className="tabular-nums">
                                    {formatCents(p.priceCents)}
                                    {p.unit === "M2" ? "/m²" : ""}
                                  </span>
                                ) : (
                                  <span className="text-amber-600">a definir</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 pr-2 text-xs text-muted-foreground">
                          {item.category?.name ?? item.group ?? "—"}
                          {item.subcategory ? (
                            <span className="block">{item.subcategory.name}</span>
                          ) : null}
                        </td>
                        <td className="py-2 pr-2">
                          {noSite ? (
                            <form action={toggleSiteAction}>
                              <input type="hidden" name="priceItemId" value={item.id} />
                              <input type="hidden" name="noSite" value="0" />
                              <button
                                type="submit"
                                className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 hover:bg-green-200"
                                title="Clique para tirar do site"
                              >
                                no site
                              </button>
                            </form>
                          ) : podeSubir ? (
                            <form action={toggleSiteAction}>
                              <input type="hidden" name="priceItemId" value={item.id} />
                              <input type="hidden" name="noSite" value="1" />
                              <button
                                type="submit"
                                className="text-xs text-primary underline-offset-2 hover:underline"
                              >
                                subir
                              </button>
                            </form>
                          ) : (
                            <span
                              className="text-xs text-muted-foreground"
                              title="Precisa de foto e categoria"
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/admin/produtos/${item.id}/editar`}
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
                    );
                  })}
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
            unidade e valor por código, preservando foto, categoria e publicação no site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/produtos/site" className="text-sm text-primary hover:underline">
            Ver vitrines que existem somente no site →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
