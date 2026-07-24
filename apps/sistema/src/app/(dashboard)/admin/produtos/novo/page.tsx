import Link from "next/link";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { listCategoriesWithSubs } from "@/server/services/products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  await requireUser(STAFF_ROLES);
  const categories = await listCategoriesWithSubs();

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Novo produto</h1>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Categorias ainda não importadas</CardTitle>
            <CardDescription>
              Rode o seed de catálogo (categorias + produtos) antes de cadastrar novos itens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/produtos" className={buttonVariants({ variant: "outline" })}>
              Voltar
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Novo produto</h1>
        <p className="text-muted-foreground">Cadastre um item do catálogo.</p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <ProductForm
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
