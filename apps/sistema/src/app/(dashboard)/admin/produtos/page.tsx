import Link from "next/link";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { listProducts, listCategoriesWithSubs } from "@/server/services/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/money";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteProductAction } from "./actions";

export const dynamic = "force-dynamic";

const SELECT_CLASS =
  "h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  await requireUser(STAFF_ROLES);
  const { q, categoria } = await searchParams;

  const [products, categories] = await Promise.all([
    listProducts({ search: q?.trim() || undefined, categoryId: categoria || undefined }),
    listCategoriesWithSubs(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Cadastre e gerencie os produtos do catálogo.</p>
        </div>
        <Link href="/admin/produtos/novo" className={buttonVariants({ className: "w-fit" })}>
          Novo produto
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo ({products.length})</CardTitle>
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
            <Link href="/admin/produtos" className={buttonVariants({ variant: "ghost" })}>
              Limpar
            </Link>
            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              Filtrar
            </button>
          </form>

          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {q || categoria ? "Nenhum produto encontrado." : "Nenhum produto cadastrado ainda."}
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
                      href={`/admin/produtos/${p.id}/editar`}
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
