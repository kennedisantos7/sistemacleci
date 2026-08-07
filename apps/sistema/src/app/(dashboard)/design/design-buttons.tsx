"use client";

import { useActionState, useRef } from "react";
import {
  requestDesignAction,
  cancelDesignAction,
  claimDesignAction,
  deliverDesignAction,
  requestRevisionAction,
  approveArtAction,
  type DesignState,
} from "./actions";
import { Button } from "@/components/ui/button";

const initial: DesignState = {};

function Erro({ state }: { state: DesignState }) {
  if (!state.error) return null;
  return <p className="text-xs text-red-600">{state.error}</p>;
}

/** Envia para o design, com um briefing opcional. */
export function RequestDesignForm({ budgetId }: { budgetId: string }) {
  const [state, action, pending] = useActionState(requestDesignAction, initial);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="budgetId" value={budgetId} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">O que o design precisa saber</span>
        <textarea
          name="brief"
          rows={3}
          maxLength={2000}
          placeholder="Ex.: logo da loja em vinil, fundo azul, aplicar na fachada de 3x2m."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Enviando..." : "Enviar para o design"}
      </Button>
      <Erro state={state} />
    </form>
  );
}

export function CancelDesignButton({ budgetId }: { budgetId: string }) {
  const [state, action, pending] = useActionState(cancelDesignAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-1">
      <input type="hidden" name="budgetId" value={budgetId} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Cancelar a solicitação de arte? O briefing será apagado."))
            formRef.current?.requestSubmit();
        }}
      >
        {pending ? "Cancelando..." : "Cancelar solicitação"}
      </Button>
      <Erro state={state} />
    </form>
  );
}

export function ClaimDesignButton({ budgetId }: { budgetId: string }) {
  const [state, action, pending] = useActionState(claimDesignAction, initial);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="budgetId" value={budgetId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Assumindo..." : "Assumir este trabalho"}
      </Button>
      <Erro state={state} />
    </form>
  );
}

/** Devolve ao vendedor. Só habilita depois de anexar a arte. */
export function DeliverDesignForm({
  budgetId,
  habilitado,
}: {
  budgetId: string;
  habilitado: boolean;
}) {
  const [state, action, pending] = useActionState(deliverDesignAction, initial);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="budgetId" value={budgetId} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Recado para o vendedor (opcional)</span>
        <textarea
          name="nota"
          rows={2}
          maxLength={2000}
          placeholder="Ex.: usei a cor do logo antigo, confirme com o cliente."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending || !habilitado}>
        {pending ? "Entregando..." : "Entregar ao vendedor"}
      </Button>
      {!habilitado ? (
        <p className="text-xs text-muted-foreground">Anexe a arte para poder entregar.</p>
      ) : null}
      <Erro state={state} />
    </form>
  );
}

export function RequestRevisionForm({ budgetId }: { budgetId: string }) {
  const [state, action, pending] = useActionState(requestRevisionAction, initial);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="budgetId" value={budgetId} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">O que precisa mudar</span>
        <textarea
          name="motivo"
          rows={2}
          maxLength={2000}
          placeholder="Ex.: o cliente quer o telefone maior e a logo à esquerda."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Enviando..." : "Pedir ajuste"}
      </Button>
      <Erro state={state} />
    </form>
  );
}

export function ApproveArtButton({ budgetId }: { budgetId: string }) {
  const [state, action, pending] = useActionState(approveArtAction, initial);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="budgetId" value={budgetId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Registrando..." : "Cliente aprovou a arte"}
      </Button>
      <Erro state={state} />
    </form>
  );
}
