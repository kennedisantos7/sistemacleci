"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteBudgetAction } from "./actions";

function BotaoIcone({ onConfirmar, label }: { onConfirmar: () => void; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onConfirmar}
      aria-label={`Excluir o rascunho ${label}`}
      title="Excluir rascunho"
      className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/**
 * Exclui um rascunho direto da listagem. Só renderizado para admin/gerente —
 * a permissão de verdade é conferida no servidor (deleteBudget só apaga o que
 * está no escopo do papel e só enquanto for rascunho sem venda).
 */
export function DeleteDraftButton({ budgetId, label }: { budgetId: string; label: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={deleteBudgetAction}>
      <input type="hidden" name="budgetId" value={budgetId} />
      <BotaoIcone
        label={label}
        onConfirmar={() => {
          if (window.confirm(`Excluir o rascunho ${label}? Essa ação não pode ser desfeita.`)) {
            formRef.current?.requestSubmit();
          }
        }}
      />
    </form>
  );
}
