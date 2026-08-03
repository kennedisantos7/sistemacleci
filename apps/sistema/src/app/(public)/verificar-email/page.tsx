import Link from "next/link";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { consumeVerificationToken } from "@/server/services/email-verification";
import { ResendVerificationForm } from "./resend-form";

export const dynamic = "force-dynamic";

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await consumeVerificationToken(token ?? "");

  const view = (() => {
    switch (result.status) {
      case "verificado":
      case "ja_confirmado":
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
          title:
            result.status === "verificado" ? "E-mail confirmado!" : "Este e-mail já estava confirmado",
          // Confirmar o e-mail não libera o acesso: a conta ainda passa pela
          // aprovação do administrador.
          body: result.alreadyActive
            ? "Sua conta está ativa. Você já pode entrar no sistema."
            : "Falta só a liberação do administrador. Assim que sua conta for aprovada, você poderá entrar.",
          showResend: false,
        };
      case "expirado":
        return {
          icon: <Clock className="h-12 w-12 text-amber-500" />,
          title: "Link expirado",
          body: "Este link de confirmação venceu (ele vale por 24 horas). Peça um novo abaixo.",
          showResend: true,
        };
      default:
        return {
          icon: <XCircle className="h-12 w-12 text-red-600" />,
          title: "Link inválido",
          body: "Este link não é válido ou já foi usado. Se precisar, peça um novo abaixo.",
          showResend: true,
        };
    }
  })();

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm border-t-4 border-t-primary">
        <CardHeader className="items-center text-center">
          <div className="mb-1 text-3xl font-heading font-extrabold text-primary">
            Cleci<span className="text-secondary">.</span>
          </div>
          <div className="flex justify-center py-2">{view.icon}</div>
          <CardTitle className="text-xl">{view.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">{view.body}</p>

          {view.showResend ? <ResendVerificationForm /> : null}

          <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Ir para o login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
