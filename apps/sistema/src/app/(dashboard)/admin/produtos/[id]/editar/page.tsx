import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { getProduct, listCategoriesWithSubs } from "@/server/services/products";
import { Card, CardContent } from "@/components/ui/card";
import { ProductForm } from "../../product-form";

export const dynamic = "force-dynamic";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(STAFF_ROLES);
  const { id } = await params;

  const [product, categories] = await Promise.all([getProduct(id), listCategoriesWithSubs()]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Editar produto</h1>
        <p className="text-muted-foreground">{product.title}</p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <ProductForm
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })),
            }))}
            defaults={{
              id: product.id,
              categoryId: product.categoryId,
              subcategoryId: product.subcategoryId,
              title: product.title,
              description: product.description,
              priceCents: product.priceCents,
              imageUrl: product.imageUrl,
              gallery: product.gallery,
              sizes: product.sizes,
              codes: product.codes,
              badge: product.badge,
              code: product.code,
              active: product.active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
