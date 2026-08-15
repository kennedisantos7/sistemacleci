import Link from "next/link";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listCategoriesWithSubs } from "@/server/services/products";
import { PriceItemForm } from "../product-item-form";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  await requireUser(FULL_ACCESS_ROLES);
  const categorias = await listCategoriesWithSubs();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Novo produto</h1>
        <p className="text-muted-foreground">
          Fica disponível na busca do orçamento assim que for salvo.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados do produto</CardTitle>
          <CardDescription>O código precisa ser único.</CardDescription>
        </CardHeader>
        <CardContent>
          <PriceItemForm
            categorias={categorias.map((c) => ({
              id: c.id,
              name: c.name,
              subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })),
            }))}
          />
        </CardContent>
      </Card>

      <Link href="/admin/produtos" className="text-sm text-primary hover:underline">
        ← Voltar para Produtos
      </Link>
    </div>
  );
}
