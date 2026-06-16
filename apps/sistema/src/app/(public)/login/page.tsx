import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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
