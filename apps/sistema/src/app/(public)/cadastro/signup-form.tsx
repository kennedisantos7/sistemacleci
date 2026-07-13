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
        <p className="text-sm">
          Cadastro recebido! Sua conta está <strong>pendente de aprovação</strong>. Você poderá
          entrar assim que o administrador liberar o acesso.
        </p>
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
