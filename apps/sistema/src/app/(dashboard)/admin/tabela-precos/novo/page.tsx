import Link from "next/link";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceItemForm } from "../price-item-form";

export const dynamic = "force-dynamic";

export default async function NovoPriceItemPage() {
  await requireUser(STAFF_ROLES);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Novo produto na tabela</h1>
        <p className="text-muted-foreground">
          Fica disponível na busca do orçamento assim que for salvo.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados do produto</CardTitle>
          <CardDescription>O código precisa ser único na tabela.</CardDescription>
        </CardHeader>
        <CardContent>
          <PriceItemForm />
        </CardContent>
      </Card>

      <Link href="/admin/tabela-precos" className="text-sm text-primary hover:underline">
        ← Voltar para a tabela de preços
      </Link>
    </div>
  );
}
