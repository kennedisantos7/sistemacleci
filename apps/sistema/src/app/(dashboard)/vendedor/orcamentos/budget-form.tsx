"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createBudgetAction, updateBudgetAction, type BudgetFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCents, parseReaisToCents, parseQuantity } from "@/lib/money";

const initial: BudgetFormState = {};

type ItemRow = {
  key: string;
  description: string;
  quantity: string; // texto digitado ("2" | "2,5")
  unitPrice: string; // texto em reais ("123,45")
};

export type BudgetDefaults = {
  id?: string;
  clientId?: string;
  title?: string | null;
  note?: string | null;
  validUntil?: string | null; // "YYYY-MM-DD"
  items?: Array<{ description: string; quantity: number; unitPriceCents: number }>;
};

export type ClientOption = { id: string; name: string; companyName: string | null };

function newRow(partial?: Partial<ItemRow>): ItemRow {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitPrice: "",
    ...partial,
  };
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function BudgetForm({
  clients,
  defaults,
}: {
  clients: ClientOption[];
  defaults?: BudgetDefaults;
}) {
  const isEdit = Boolean(defaults?.id);
  const [state, action, pending] = useActionState(
    isEdit ? updateBudgetAction : createBudgetAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const [items, setItems] = useState<ItemRow[]>(() =>
    defaults?.items?.length
      ? defaults.items.map((it) =>
          newRow({
            description: it.description,
            quantity: String(it.quantity).replace(".", ","),
            unitPrice: centsToInput(it.unitPriceCents),
          }),
        )
      : [newRow()],
  );

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  // Itens já convertidos (null = campo inválido/incompleto).
  const parsedItems = useMemo(
    () =>
      items.map((r) => ({
        description: r.description.trim(),
        quantity: parseQuantity(r.quantity),
        unitPriceCents: parseReaisToCents(r.unitPrice),
      })),
    [items],
  );

  const totalCents = useMemo(
    () =>
      parsedItems.reduce((sum, it) => {
        if (it.quantity == null || it.unitPriceCents == null) return sum;
        return sum + Math.round(it.quantity * it.unitPriceCents);
      }, 0),
    [parsedItems],
  );

  // JSON enviado ao servidor (a validação de verdade acontece lá, com Zod).
  const itemsJson = useMemo(() => JSON.stringify(parsedItems), [parsedItems]);

  function validateItems(): boolean {
    for (let i = 0; i < parsedItems.length; i++) {
      const it = parsedItems[i];
      if (!it) continue;
      if (!it.description) {
        setLocalError(`Item ${i + 1}: descreva o item.`);
        return false;
      }
      if (it.quantity == null) {
        setLocalError(`Item ${i + 1}: quantidade inválida.`);
        return false;
      }
      if (it.unitPriceCents == null) {
        setLocalError(`Item ${i + 1}: preço inválido (use o formato 123,45).`);
        return false;
      }
    }
    setLocalError(null);
    return true;
  }

  function handleSubmit() {
    if (validateItems()) formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={action}
      // Guarda também o submit via tecla Enter dentro dos campos.
      onSubmit={(e) => {
        if (!validateItems()) e.preventDefault();
      }}
      className="space-y-6"
    >
      {isEdit ? <input type="hidden" name="budgetId" value={defaults!.id} /> : null}
      <input type="hidden" name="itemsJson" value={itemsJson} />

      {/* Cabeçalho */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="bf-client" className="text-sm font-medium">
            Cliente *
          </label>
          <select
            id="bf-client"
            name="clientId"
            required
            defaultValue={defaults?.clientId ?? ""}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="" disabled>
              Selecione...
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.companyName ? ` — ${c.companyName}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="bf-valid" className="text-sm font-medium">
            Válido até
          </label>
          <Input id="bf-valid" name="validUntil" type="date" defaultValue={defaults?.validUntil ?? ""} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="bf-title" className="text-sm font-medium">
            Título (opcional)
          </label>
          <Input
            id="bf-title"
            name="title"
            placeholder='ex.: "Fachada Loja Centro"'
            defaultValue={defaults?.title ?? ""}
          />
        </div>
      </div>

      {/* Itens */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Itens do orçamento
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((r) => [...r, newRow()])}>
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((row, i) => {
            const parsed = parsedItems[i];
            const lineCents =
              parsed && parsed.quantity != null && parsed.unitPriceCents != null
                ? Math.round(parsed.quantity * parsed.unitPriceCents)
                : null;
            return (
              <div key={row.key} className="rounded-lg border border-border bg-card p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_90px_130px_110px_auto] sm:items-start">
                  <Textarea
                    aria-label={`Descrição do item ${i + 1}`}
                    placeholder="Descrição (ex.: Banner 440g 2x1m com ilhoses)"
                    value={row.description}
                    onChange={(e) => updateItem(row.key, { description: e.target.value })}
                    className="min-h-[44px] sm:min-h-[40px]"
                    rows={1}
                  />
                  <Input
                    aria-label={`Quantidade do item ${i + 1}`}
                    placeholder="Qtd"
                    inputMode="decimal"
                    value={row.quantity}
                    onChange={(e) => updateItem(row.key, { quantity: e.target.value })}
                  />
                  <Input
                    aria-label={`Preço unitário do item ${i + 1}`}
                    placeholder="Preço un. (R$)"
                    inputMode="decimal"
                    value={row.unitPrice}
                    onChange={(e) => updateItem(row.key, { unitPrice: e.target.value })}
                  />
                  <div className="flex h-10 items-center justify-end text-sm font-medium tabular-nums">
                    {lineCents != null ? formatCents(lineCents) : "—"}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remover item ${i + 1}`}
                    disabled={items.length === 1}
                    onClick={() => setItems((rows) => rows.filter((r) => r.key !== row.key))}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 rounded-lg bg-muted/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold tabular-nums">{formatCents(totalCents)}</span>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-1">
        <label htmlFor="bf-note" className="text-sm font-medium">
          Observações (aparecem no PDF)
        </label>
        <Textarea
          id="bf-note"
          name="note"
          placeholder="Condições de pagamento, prazo de entrega, frete..."
          defaultValue={defaults?.note ?? ""}
        />
      </div>

      {localError ? <p className="text-sm text-red-600">{localError}</p> : null}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <Button type="button" disabled={pending} onClick={handleSubmit}>
        {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar orçamento"}
      </Button>
    </form>
  );
}
