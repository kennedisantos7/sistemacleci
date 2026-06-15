"use client";

import { useActionState } from "react";
import { updatePaymentInfoAction, type PaymentInfoState } from "@/server/actions/payment-info";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: PaymentInfoState = {};

export function PaymentInfoForm({
  pixKey,
  document,
  bankName,
}: {
  pixKey?: string | null;
  document?: string | null;
  bankName?: string | null;
}) {
  const [state, action, pending] = useActionState(updatePaymentInfoAction, initial);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="pixKey" className="text-sm font-medium">
          Chave Pix
        </label>
        <Input id="pixKey" name="pixKey" defaultValue={pixKey ?? ""} placeholder="e-mail, CPF ou aleatória" />
      </div>
      <div className="space-y-1">
        <label htmlFor="document" className="text-sm font-medium">
          CPF/CNPJ
        </label>
        <Input id="document" name="document" defaultValue={document ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="bankName" className="text-sm font-medium">
          Banco (opcional)
        </label>
        <Input id="bankName" name="bankName" defaultValue={bankName ?? ""} />
      </div>

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700 sm:col-span-2">Dados salvos.</p> : null}

      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Salvando..." : "Salvar dados de pagamento"}
        </Button>
      </div>
    </form>
  );
}
