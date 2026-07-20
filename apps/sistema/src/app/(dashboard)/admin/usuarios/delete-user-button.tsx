"use client";

import { useActionState, useRef } from "react";
import { deleteUserAction, type DeleteUserState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: DeleteUserState = {};

export function DeleteUserButton({ userId, userLabel }: { userId: string; userLabel: string }) {
  const [state, action, pending] = useActionState(deleteUserAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-1">
      <input type="hidden" name="userId" value={userId} />
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            `Excluir permanentemente a conta de ${userLabel}? Essa ação não pode ser desfeita.`,
          );
          if (ok) formRef.current?.requestSubmit();
        }}
      >
        {pending ? "Excluindo..." : "Excluir"}
      </Button>
      {state.error ? <p className="max-w-[180px] text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
}
