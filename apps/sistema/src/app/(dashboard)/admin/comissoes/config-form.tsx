"use client";

import { useActionState } from "react";
import { updateConfigAction, type ConfigState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: ConfigState = {};

export function ConfigForm({
  defaultRatePercent,
  cookieDays,
}: {
  defaultRatePercent: string;
  cookieDays: number;
}) {
  const [state, action, pending] = useActionState(updateConfigAction, initial);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="defaultRate" className="text-sm font-medium">
          Taxa de comissão padrão (%)
        </label>
        <Input
          id="defaultRate"
          name="defaultRate"
          defaultValue={defaultRatePercent}
          inputMode="decimal"
          required
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="cookieDays" className="text-sm font-medium">
          Duração do cookie de atribuição
        </label>
        <select
          id="cookieDays"
          name="cookieDays"
          defaultValue={cookieDays}
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value={30}>30 dias</option>
          <option value={60}>60 dias</option>
          <option value={90}>90 dias</option>
        </select>
      </div>

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-green-700 sm:col-span-2">Configuração salva.</p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar configuração"}
        </Button>
      </div>
    </form>
  );
}
