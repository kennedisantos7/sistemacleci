"use client";

import { useActionState, useRef } from "react";
import { deleteClientAction, type DeleteClientState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: DeleteClientState = {};

export function DeleteClientButton({
  clientId,
  clientLabel,
}: {
  clientId: string;
  clientLabel: string;
}) {
  const [state, action, pending] = useActionState(deleteClientAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-1">
      <input type="hidden" name="clientId" value={clientId} />
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            `Excluir o cliente ${clientLabel}? Essa ação não pode ser desfeita.`,
          );
          if (ok) formRef.current?.requestSubmit();
        }}
      >
        {pending ? "Excluindo..." : "Excluir cliente"}
      </Button>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
}
