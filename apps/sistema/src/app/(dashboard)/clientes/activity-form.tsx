"use client";

import { useActionState, useEffect, useRef } from "react";
import { addActivityAction, type OwnershipState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: OwnershipState = {};

/** Tipos lançáveis à mão (SISTEMA fica de fora — é gerado pelo próprio sistema). */
export const TIPOS_ATIVIDADE = [
  { value: "LIGACAO", label: "Ligação" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "VISITA", label: "Visita" },
  { value: "PROPOSTA", label: "Proposta enviada" },
  { value: "OBSERVACAO", label: "Observação" },
] as const;

export function ActivityForm({
  clientId,
  /** Empresa livre: registrar aqui transfere a titularidade para quem registra. */
  assumeAoRegistrar = false,
}: {
  clientId: string;
  assumeAoRegistrar?: boolean;
}) {
  const [state, action, pending] = useActionState(addActivityAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o campo depois de gravar, para lançar o próximo contato em seguida.
  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="text-sm sm:w-52">
          <span className="mb-1 block font-medium">Tipo</span>
          <select
            name="type"
            defaultValue="LIGACAO"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {TIPOS_ATIVIDADE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium">O que aconteceu</span>
          <textarea
            name="note"
            rows={2}
            maxLength={2000}
            placeholder="Ex.: falei com o Carlos, pediu orçamento de fachada para a loja nova."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending
            ? "Registrando..."
            : assumeAoRegistrar
              ? "Assumir e registrar"
              : "Registrar atividade"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {assumeAoRegistrar
            ? "Esta empresa está sem responsável — ao registrar, ela passa a ser sua por 30 dias."
            : "Cada registro renova por 30 dias a sua prioridade sobre esta empresa."}
        </p>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}
