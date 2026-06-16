import { requireUser } from "@/server/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>Recomendado trocar a senha provisória no primeiro acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
