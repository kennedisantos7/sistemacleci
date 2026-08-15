import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { getPriceItem } from "@/server/services/price-items";
import { listCategoriesWithSubs } from "@/server/services/products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceItemForm } from "../../product-item-form";
import type { BudgetUnit } from "@/lib/budget-math";

export const dynamic = "force-dynamic";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(FULL_ACCESS_ROLES);
  const { id } = await params;

  const [item, categorias] = await Promise.all([getPriceItem(id), listCategoriesWithSubs()]);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Editar produto</h1>
        <p className="text-muted-foreground">
          {item.code} · {item.description}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados do produto</CardTitle>
          <CardDescription>
            Orçamentos já gravados guardam o valor da época — mudar aqui não altera o histórico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceItemForm
            categorias={categorias.map((c) => ({
              id: c.id,
              name: c.name,
              subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })),
            }))}
            defaults={{
              id: item.id,
              code: item.code,
              description: item.description,
              unit: item.unit as BudgetUnit,
              priceCents: item.priceCents,
              prices: item.prices.map((p) => ({
                unit: p.unit as BudgetUnit,
                priceCents: p.priceCents,
              })),
              group: item.group,
              imageUrl: item.imageUrl,
              categoryId: item.categoryId,
              subcategoryId: item.subcategoryId,
              // Publicado = tem vitrine E ela está no ar. Vitrine desligada
              // conta como fora do site, senão a chave mentiria.
              noSite: Boolean(item.siteProduct?.active),
              siteProductId: item.siteProductId,
              active: item.active,
            }}
          />
        </CardContent>
      </Card>

      <Link href="/admin/produtos" className="text-sm text-primary hover:underline">
        ← Voltar para Produtos
      </Link>
    </div>
  );
}
