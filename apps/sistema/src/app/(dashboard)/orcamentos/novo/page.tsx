import Link from "next/link";
import { requireUser } from "@/server/session";
import { listClientOptions } from "@/server/services/clients";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BUDGET_ROLES } from "@/lib/rbac";
import { BudgetForm } from "../budget-form";

export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const user = await requireUser(BUDGET_ROLES);
  const { cliente } = await searchParams;

  const clients = await listClientOptions(user);

  if (clients.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Novo orçamento</h1>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Cadastre um cliente primeiro</CardTitle>
            <CardDescription>Todo orçamento é vinculado a um cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/clientes/novo" className={buttonVariants()}>
              Cadastrar cliente
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const preselected = clients.some((c) => c.id === cliente) ? cliente : undefined;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Novo orçamento</h1>
        <p className="text-muted-foreground">
          Busque os produtos pelo código ou nome — o sistema calcula os totais. O documento nasce
          como rascunho.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <BudgetForm
            clients={clients.map((c) => ({ id: c.id, name: c.name, companyName: c.companyName }))}
            defaults={preselected ? { clientId: preselected } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
