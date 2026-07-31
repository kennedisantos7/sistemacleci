"use client";

import { useActionState } from "react";
import {
  createPriceItemAction,
  updatePriceItemAction,
  type PriceItemFormState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UNIT_LABEL, type BudgetUnit } from "@/lib/budget-math";

const initial: PriceItemFormState = {};

const UNITS: BudgetUnit[] = ["M2", "UNIDADE", "PACOTE", "MILHEIRO"];

export type PriceItemDefaults = {
  id?: string;
  code?: string;
  description?: string;
  unit?: BudgetUnit;
  priceCents?: number;
  group?: string | null;
  active?: boolean;
};

export function PriceItemForm({ defaults }: { defaults?: PriceItemDefaults }) {
  const isEdit = Boolean(defaults?.id);
  const [state, action, pending] = useActionState(
    isEdit ? updatePriceItemAction : createPriceItemAction,
    initial,
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {isEdit ? <input type="hidden" name="priceItemId" value={defaults!.id} /> : null}

      <div className="space-y-1">
        <label htmlFor="pi-code" className="text-sm font-medium">
          Código *
        </label>
        <Input id="pi-code" name="code" required defaultValue={defaults?.code ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="pi-unit" className="text-sm font-medium">
          Unidade *
        </label>
        <select
          id="pi-unit"
          name="unit"
          defaultValue={defaults?.unit ?? "UNIDADE"}
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {UNIT_LABEL[u]}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          M² cobra por área (largura × comprimento) no orçamento.
        </p>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="pi-description" className="text-sm font-medium">
          Descrição *
        </label>
        <Input
          id="pi-description"
          name="description"
          required
          defaultValue={defaults?.description ?? ""}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="pi-price" className="text-sm font-medium">
          Valor (R$)
        </label>
        <Input
          id="pi-price"
          name="price"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={
            defaults?.priceCents ? (defaults.priceCents / 100).toFixed(2).replace(".", ",") : ""
          }
        />
        <p className="text-xs text-muted-foreground">
          Deixe 0 para &quot;preço a definir&quot; — o vendedor digita no orçamento.
        </p>
      </div>
      <div className="space-y-1">
        <label htmlFor="pi-group" className="text-sm font-medium">
          Grupo
        </label>
        <Input
          id="pi-group"
          name="group"
          placeholder="ex.: Tapetes"
          defaultValue={defaults?.group ?? ""}
        />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaults?.active ?? true}
          className="h-4 w-4"
        />
        Ativo (aparece na busca do orçamento)
      </label>

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Adicionar produto"}
        </Button>
      </div>
    </form>
  );
}
