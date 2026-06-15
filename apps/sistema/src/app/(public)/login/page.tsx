import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sistema Cleci</CardTitle>
          <CardDescription>Acesse o painel de afiliados e vendas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            Quer ser afiliado?{" "}
            <Link href="/cadastro" className="text-primary underline">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
