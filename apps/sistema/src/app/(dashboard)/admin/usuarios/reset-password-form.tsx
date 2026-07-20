"use client";

import { useActionState, useRef } from "react";
import { resetPasswordAction, type ResetPasswordState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: ResetPasswordState = {};

export function ResetPasswordForm({ userId, userLabel }: { userId: string; userLabel: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-1">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center gap-1">
        <Input
          name="password"
          type="text"
          placeholder="nova senha"
          minLength={8}
          required
          className="h-9 w-32 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            const input = formRef.current?.elements.namedItem("password") as HTMLInputElement | null;
            if (!input || input.value.length < 8) {
              input?.reportValidity();
              return;
            }
            const ok = window.confirm(
              `Redefinir a senha de ${userLabel}? A senha atual deixará de funcionar imediatamente.`,
            );
            if (ok) formRef.current?.requestSubmit();
          }}
        >
          {pending ? "Salvando..." : "Resetar"}
        </Button>
      </div>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-green-700">{state.success}</p> : null}
    </form>
  );
}
