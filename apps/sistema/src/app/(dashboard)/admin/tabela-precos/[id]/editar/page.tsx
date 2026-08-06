import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { getPriceItem } from "@/server/services/price-items";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceItemForm } from "../../price-item-form";
import type { BudgetUnit } from "@/lib/budget-math";

export const dynamic = "force-dynamic";

export default async function EditarPriceItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(STAFF_ROLES);
  const { id } = await params;

  const item = await getPriceItem(id);
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
              active: item.active,
            }}
          />
        </CardContent>
      </Card>

      <Link href="/admin/tabela-precos" className="text-sm text-primary hover:underline">
        ← Voltar para a tabela de preços
      </Link>
    </div>
  );
}
