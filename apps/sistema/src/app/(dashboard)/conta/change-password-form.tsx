"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeOwnPasswordAction, type ChangePasswordState } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPasswordAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={action} className="max-w-sm space-y-4">
      <div className="space-y-1">
        <label htmlFor="current" className="text-sm font-medium">
          Senha atual
        </label>
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </div>
      <div className="space-y-1">
        <label htmlFor="next" className="text-sm font-medium">
          Nova senha
        </label>
        <Input id="next" name="next" type="password" required autoComplete="new-password" />
      </div>
      <div className="space-y-1">
        <label htmlFor="confirm" className="text-sm font-medium">
          Confirmar nova senha
        </label>
        <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">Senha alterada com sucesso.</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
