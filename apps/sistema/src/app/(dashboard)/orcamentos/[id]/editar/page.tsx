import { notFound, redirect } from "next/navigation";
import { BudgetStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { getBudgetForActor } from "@/server/services/budgets";
import { listClientOptions } from "@/server/services/clients";
import { Card, CardContent } from "@/components/ui/card";
import { BUDGET_ROLES, isStaff } from "@/lib/rbac";
import { BudgetForm } from "../../budget-form";
import type { BudgetUnit, AdjustmentKind } from "@/lib/budget-math";

export const dynamic = "force-dynamic";

export default async function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(BUDGET_ROLES);
  const { id } = await params;

  const [budget, clients] = await Promise.all([
    getBudgetForActor(user, id),
    listClientOptions(user),
  ]);
  if (!budget) notFound();
  // Só rascunhos são editáveis — enviado/aceito/recusado é imutável.
  if (budget.status !== BudgetStatus.RASCUNHO) redirect(`/orcamentos/${id}`);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">
          Editar {budget.docType === "PEDIDO" ? "pedido" : "orçamento"} #{budget.number}
        </h1>
        <p className="text-muted-foreground">Rascunho — edite à vontade antes de enviar.</p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <BudgetForm
            clients={clients.map((c) => ({ id: c.id, name: c.name, companyName: c.companyName }))}
            canManagePriceItems={isStaff(user.role)}
            defaults={{
              id: budget.id,
              clientId: budget.clientId,
              docType: budget.docType,
              title: budget.title,
              note: budget.note,
              validUntil: budget.validUntil ? budget.validUntil.toISOString().slice(0, 10) : null,
              paymentTerms: budget.paymentTerms,
              deliveryForecast: budget.deliveryForecast,
              deliveryCity: budget.deliveryCity,
              items: budget.items.map((it) => ({
                priceItemId: it.priceItemId,
                code: it.code,
                description: it.description,
                unit: it.unit as BudgetUnit,
                widthM: it.widthM ? Number(it.widthM) : null,
                lengthM: it.lengthM ? Number(it.lengthM) : null,
                quantity: Number(it.quantity),
                unitPriceCents: it.unitPriceCents,
              })),
              adjustments: {
                discount: {
                  mode: budget.discountMode as AdjustmentKind,
                  input: budget.discountInput,
                },
                surcharge: {
                  mode: budget.surchargeMode as AdjustmentKind,
                  input: budget.surchargeInput,
                },
                freight: { mode: budget.freightMode as AdjustmentKind, input: budget.freightInput },
                tax: { mode: budget.taxMode as AdjustmentKind, input: budget.taxInput },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
