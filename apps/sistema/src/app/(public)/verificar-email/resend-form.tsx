"use client";

import { useActionState } from "react";
import { resendVerificationAction, type ResendState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: ResendState = {};

export function ResendVerificationForm() {
  const [state, action, pending] = useActionState(resendVerificationAction, initial);

  if (state.sent) {
    return (
      <p className="rounded-md bg-muted p-3 text-center text-sm">
        Se existir uma conta com esse e-mail aguardando confirmação, enviamos um novo link. Confira
        também a caixa de spam.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <label htmlFor="resend-email" className="text-sm font-medium">
        Reenviar link de confirmação
      </label>
      <Input
        id="resend-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="seu@email.com"
      />
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" variant="outline" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar novo link"}
      </Button>
    </form>
  );
}
