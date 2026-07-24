import { requireUser } from "@/server/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "../client-form";

export const dynamic = "force-dynamic";

export default async function NovoClientePage() {
  await requireUser(["VENDEDOR_FIXO"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Novo cliente</h1>
        <p className="text-muted-foreground">Cadastre um cliente/empresa da sua carteira.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados do cliente</CardTitle>
          <CardDescription>Só o nome é obrigatório — complete o resto quando tiver.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
