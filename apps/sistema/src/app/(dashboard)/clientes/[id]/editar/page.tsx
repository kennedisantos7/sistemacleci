import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { BUDGET_ROLES } from "@/lib/rbac";
import { getClientForActor } from "@/server/services/clients";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "../../client-form";
import { DeleteClientButton } from "../../delete-client-button";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(BUDGET_ROLES);
  const { id } = await params;

  const client = await getClientForActor(user, id);
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Editar cliente</h1>
        <p className="text-muted-foreground">{client.name}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm defaults={client} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zona de risco</CardTitle>
          <CardDescription>
            Clientes com orçamentos registrados não podem ser excluídos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteClientButton clientId={client.id} clientLabel={client.name} />
        </CardContent>
      </Card>
    </div>
  );
}
