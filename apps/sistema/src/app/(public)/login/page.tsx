import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isGoogleEnabled } from "@/auth";
import { LoginForm } from "./login-form";
import { GoogleButton } from "./google-button";

export const dynamic = "force-dynamic";

/** Mensagens vindas do callback `signIn` (login com Google barrado). */
const AVISOS: Record<string, string> = {
  pendente:
    "Sua conta ainda não foi liberada pelo administrador. Você receberá acesso assim que for aprovada.",
  bloqueada: "Esta conta está bloqueada. Fale com o administrador.",
  "sem-conta":
    "Não encontramos uma conta com esse e-mail do Google. Cadastre-se primeiro usando o mesmo endereço.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const aviso = erro ? AVISOS[erro] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="mb-1 text-3xl font-heading font-extrabold text-primary">
            Cleci<span className="text-secondary">.</span>
          </div>
          <CardTitle className="text-xl">Sistema de Afiliados &amp; Vendas</CardTitle>
          <CardDescription>Acesse seu painel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aviso ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {aviso}
            </p>
          ) : null}

          {isGoogleEnabled ? (
            <>
              <GoogleButton />
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">ou</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          ) : null}

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground">
            Quer ser afiliado?{" "}
            <Link href="/cadastro" className="text-primary underline">
              Cadastre-se
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Não recebeu o e-mail de confirmação?{" "}
            <Link href="/verificar-email" className="text-primary underline">
              Reenviar link
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
