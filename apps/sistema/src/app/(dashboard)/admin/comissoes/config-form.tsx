"use client";

import { useActionState } from "react";
import { updateConfigAction, type ConfigState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: ConfigState = {};

export function ConfigForm({
  afiliadoVendaPercent,
  afiliadoIndicacaoPercent,
  desenvolvedorPercent,
  cookieDays,
}: {
  afiliadoVendaPercent: string;
  afiliadoIndicacaoPercent: string;
  desenvolvedorPercent: string;
  cookieDays: number;
}) {
  const [state, action, pending] = useActionState(updateConfigAction, initial);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="afiliadoVenda" className="text-sm font-medium">
          Afiliado — venda no gateway (%)
        </label>
        <Input
          id="afiliadoVenda"
          name="afiliadoVenda"
          defaultValue={afiliadoVendaPercent}
          inputMode="decimal"
          required
        />
        <p className="text-xs text-muted-foreground">Cliente pagou pelo link de pagamento.</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="afiliadoIndicacao" className="text-sm font-medium">
          Afiliado — indicação (%)
        </label>
        <Input
          id="afiliadoIndicacao"
          name="afiliadoIndicacao"
          defaultValue={afiliadoIndicacaoPercent}
          inputMode="decimal"
          required
        />
        <p className="text-xs text-muted-foreground">Só enviou o lead pelo link de WhatsApp.</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="desenvolvedor" className="text-sm font-medium">
          Desenvolvedor (%)
        </label>
        <Input
          id="desenvolvedor"
          name="desenvolvedor"
          defaultValue={desenvolvedorPercent}
          inputMode="decimal"
          required
        />
        <p className="text-xs text-muted-foreground">Sobre vendas atribuídas a um afiliado.</p>
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
          {pending ? "Salvando..." : "Salvar taxas"}
        </Button>
      </div>
    </form>
  );
}
