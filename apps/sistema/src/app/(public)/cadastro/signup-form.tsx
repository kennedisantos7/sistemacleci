"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type SignupState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: SignupState = {};

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initial);

  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        {state.emailSent ? (
          <>
            <p className="text-sm">
              Cadastro recebido! Enviamos um e-mail para você <strong>confirmar seu endereço</strong>
              . Confira a caixa de entrada (e o spam).
            </p>
            <p className="text-sm text-muted-foreground">
              Depois de confirmar, sua conta ainda passa pela aprovação do administrador — você será
              avisado quando o acesso for liberado.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm">
              Cadastro recebido! Mas <strong>não conseguimos enviar o e-mail de confirmação</strong>{" "}
              agora.
            </p>
            <p className="text-sm text-muted-foreground">
              Peça um novo link na página de{" "}
              <Link href="/verificar-email" className="text-primary underline">
                reenvio de confirmação
              </Link>
              .
            </p>
          </>
        )}
        <Link href="/login" className="text-sm text-primary underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nome completo
        </label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirm" className="text-sm font-medium">
          Confirmar senha
        </label>
        <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Criar conta de afiliado"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Ao criar a conta, você concorda com a nossa{" "}
        <a
          href={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://cleci.com.br"}/privacidade`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Política de Privacidade
        </a>
        .
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
