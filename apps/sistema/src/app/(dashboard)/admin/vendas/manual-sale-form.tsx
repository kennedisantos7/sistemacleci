"use client";

import { useActionState } from "react";
import { registerManualSaleAction, type ManualSaleState } from "@/server/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: ManualSaleState = {};

export function ManualSaleForm() {
  const [state, action, pending] = useActionState(registerManualSaleAction, initial);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="amount" className="text-sm font-medium">
          Valor (R$)
        </label>
        <Input id="amount" name="amount" placeholder="123,45" required inputMode="decimal" />
      </div>
      <div className="space-y-1">
        <label htmlFor="ref" className="text-sm font-medium">
          Código do afiliado (ref) — opcional
        </label>
        <Input id="ref" name="ref" placeholder="AbC123dE" />
      </div>
      <div className="space-y-1">
        <label htmlFor="customerName" className="text-sm font-medium">
          Cliente
        </label>
        <Input id="customerName" name="customerName" />
      </div>
      <div className="space-y-1">
        <label htmlFor="customerEmail" className="text-sm font-medium">
          E-mail do cliente — opcional
        </label>
        <Input id="customerEmail" name="customerEmail" type="email" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="note" className="text-sm font-medium">
          Observação — opcional
        </label>
        <Input id="note" name="note" />
      </div>

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}
      {state.success ? (
        <div className="space-y-1 text-sm text-green-700 sm:col-span-2">
          <p>{state.success}</p>
          {state.paymentUrl ? (
            <a className="break-all text-primary underline" href={state.paymentUrl} target="_blank">
              {state.paymentUrl}
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" name="action" value="mark_paid" disabled={pending}>
          Registrar como paga
        </Button>
        <Button
          type="submit"
          name="action"
          value="payment_link"
          variant="outline"
          disabled={pending}
        >
          Gerar link de pagamento
        </Button>
        <Button type="submit" name="action" value="pending" variant="ghost" disabled={pending}>
          Salvar pendente
        </Button>
      </div>
    </form>
  );
}
