"use client";

import { useActionState } from "react";
import { requestPayoutAction, type PayoutRequestState } from "@/server/actions/payouts";
import { Button } from "@/components/ui/button";

const initial: PayoutRequestState = {};

export function RequestPayoutForm({ disabledReason }: { disabledReason?: string }) {
  const [state, action, pending] = useActionState(requestPayoutAction, initial);

  return (
    <form action={action} className="space-y-2">
      <Button type="submit" disabled={pending || Boolean(disabledReason)}>
        {pending ? "Solicitando..." : "Solicitar saque do saldo disponível"}
      </Button>
      {disabledReason ? <p className="text-sm text-muted-foreground">{disabledReason}</p> : null}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-green-700">Saque solicitado! Aguarde a aprovação do admin.</p>
      ) : null}
    </form>
  );
}
