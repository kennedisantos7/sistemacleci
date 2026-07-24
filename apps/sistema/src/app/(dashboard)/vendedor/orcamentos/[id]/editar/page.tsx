import { notFound, redirect } from "next/navigation";
import { BudgetStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { getBudgetForVendedor } from "@/server/services/budgets";
import { listClients } from "@/server/services/clients";
import { Card, CardContent } from "@/components/ui/card";
import { BudgetForm } from "../../budget-form";

export const dynamic = "force-dynamic";

export default async function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const { id } = await params;

  const [budget, clients] = await Promise.all([
    getBudgetForVendedor(user.id, id),
    listClients(user.id),
  ]);
  if (!budget) notFound();
  // Só rascunhos são editáveis — enviado/aceito/recusado é imutável.
  if (budget.status !== BudgetStatus.RASCUNHO) redirect(`/vendedor/orcamentos/${id}`);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Editar orçamento #{budget.number}</h1>
        <p className="text-muted-foreground">Rascunho — edite à vontade antes de enviar.</p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <BudgetForm
            clients={clients.map((c) => ({ id: c.id, name: c.name, companyName: c.companyName }))}
            defaults={{
              id: budget.id,
              clientId: budget.clientId,
              title: budget.title,
              note: budget.note,
              validUntil: budget.validUntil ? budget.validUntil.toISOString().slice(0, 10) : null,
              items: budget.items.map((it) => ({
                description: it.description,
                quantity: Number(it.quantity),
                unitPriceCents: it.unitPriceCents,
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
