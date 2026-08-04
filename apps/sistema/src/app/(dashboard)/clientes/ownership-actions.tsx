"use client";

import { useActionState, useRef } from "react";
import {
  claimClientAction,
  releaseClientAction,
  transferClientAction,
  type OwnershipState,
} from "./actions";
import { Button } from "@/components/ui/button";

const initial: OwnershipState = {};

function Erro({ state }: { state: OwnershipState }) {
  if (!state.error) return null;
  return <p className="text-xs text-red-600">{state.error}</p>;
}

/** Assumir o atendimento de uma empresa livre ou com prazo vencido. */
export function ClaimClientButton({ clientId, label }: { clientId: string; label: string }) {
  const [state, action, pending] = useActionState(claimClientAction, initial);

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="clientId" value={clientId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Assumindo..." : `Assumir ${label}`}
      </Button>
      <Erro state={state} />
    </form>
  );
}

/** Devolver a empresa para a base — confirma porque o vendedor perde a conta. */
export function ReleaseClientButton({ clientId }: { clientId: string }) {
  const [state, action, pending] = useActionState(releaseClientAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-1">
      <input type="hidden" name="clientId" value={clientId} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            "Liberar esta empresa? Ela fica disponível para qualquer vendedor da equipe assumir.",
          );
          if (ok) formRef.current?.requestSubmit();
        }}
      >
        {pending ? "Liberando..." : "Liberar empresa"}
      </Button>
      <Erro state={state} />
    </form>
  );
}

/** Transferência direta — renderizada apenas para a equipe administrativa. */
export function TransferClientForm({
  clientId,
  ownerId,
  vendedores,
}: {
  clientId: string;
  ownerId: string | null;
  vendedores: Array<{ id: string; name: string | null; email: string }>;
}) {
  const [state, action, pending] = useActionState(transferClientAction, initial);

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="clientId" value={clientId} />
      <label className="flex-1 text-sm">
        <span className="mb-1 block font-medium">Transferir para</span>
        <select
          name="paraUserId"
          defaultValue=""
          required
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="" disabled>
            Selecione o vendedor...
          </option>
          {vendedores
            .filter((v) => v.id !== ownerId)
            .map((v) => (
              <option key={v.id} value={v.id}>
                {v.name ?? v.email}
              </option>
            ))}
        </select>
      </label>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Transferindo..." : "Transferir"}
      </Button>
      <Erro state={state} />
    </form>
  );
}
