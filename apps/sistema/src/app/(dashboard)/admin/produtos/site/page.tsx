import Link from "next/link";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { listCategoriesWithSubs } from "@/server/services/products";
import { listUnlinkedSiteProducts } from "@/server/services/price-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/money";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteProductAction } from "./actions";

export const dynamic = "force-dynamic";

const SELECT_CLASS =
  "h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/**
 * Vitrines que existem SÓ no site — não vieram do cadastro de Produtos e não
 * têm código, então não aparecem para o vendedor no orçamento. São registros
 * de antes da unificação; a tela existe para que continuem editáveis.
 */
export default async function ProdutosSomenteNoSitePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  await requireUser(FULL_ACCESS_ROLES);
  const { q, categoria } = await searchParams;

  const [todos, categories] = await Promise.all([
    listUnlinkedSiteProducts(q?.trim() || undefined),
    listCategoriesWithSubs(),
  ]);
  const products = categoria ? todos.filter((p) => p.categoryId === categoria) : todos;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-sm text-primary hover:underline">
          ← Voltar para Produtos
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Somente no site</h1>
          <p className="text-muted-foreground">
            Vitrines sem cadastro correspondente — aparecem no site, mas não na busca do
            orçamento. Para que o vendedor use uma delas, cadastre o produto com código em
            Produtos e ligue a chave &quot;Subir no site&quot;.
          </p>
        </div>
        <Link href="/admin/produtos/site/novo" className={buttonVariants({ className: "w-fit" })}>
          Nova vitrine
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Vitrines ({products.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="flex flex-wrap gap-2">
            <Input name="q" placeholder="Buscar por título" defaultValue={q ?? ""} className="max-w-xs" />
            <select name="categoria" defaultValue={categoria ?? ""} className={SELECT_CLASS}>
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Link href="/admin/produtos/site" className={buttonVariants({ variant: "ghost" })}>
              Limpar
            </Link>
            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              Filtrar
            </button>
          </form>

          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {q || categoria
                ? "Nenhuma vitrine encontrada."
                : "Nenhuma vitrine solta — todo produto do site tem cadastro."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {p.title}
                      {!p.active ? (
                        <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700">
                          inativo
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.category.name}
                      {p.subcategory ? ` · ${p.subcategory.name}` : ""}
                      {p.priceCents != null ? ` · ${formatCents(p.priceCents)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/produtos/site/${p.id}/editar`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Editar
                    </Link>
                    <ConfirmSubmitButton
                      action={deleteProductAction}
                      hidden={{ productId: p.id }}
                      label="Excluir"
                      pendingLabel="Excluindo..."
                      variant="destructive"
                      confirmMessage={`Excluir o produto "${p.title}"? Essa ação não pode ser desfeita.`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
