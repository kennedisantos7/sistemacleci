"use client";

import { useActionState } from "react";
import { createClientAction, updateClientAction, type ClientFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initial: ClientFormState = {};

export type ClientDefaults = {
  id?: string;
  name?: string;
  companyName?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
};

export function ClientForm({ defaults }: { defaults?: ClientDefaults }) {
  const isEdit = Boolean(defaults?.id);
  const [state, action, pending] = useActionState(
    isEdit ? updateClientAction : createClientAction,
    initial,
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {isEdit ? <input type="hidden" name="clientId" value={defaults!.id} /> : null}

      <div className="space-y-1">
        <label htmlFor="cl-name" className="text-sm font-medium">
          Nome do contato *
        </label>
        <Input id="cl-name" name="name" required defaultValue={defaults?.name ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-company" className="text-sm font-medium">
          Empresa
        </label>
        <Input id="cl-company" name="companyName" defaultValue={defaults?.companyName ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-document" className="text-sm font-medium">
          CPF/CNPJ
        </label>
        <Input id="cl-document" name="document" defaultValue={defaults?.document ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-phone" className="text-sm font-medium">
          Telefone / WhatsApp
        </label>
        <Input id="cl-phone" name="phone" defaultValue={defaults?.phone ?? ""} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="cl-email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="cl-email" name="email" type="email" defaultValue={defaults?.email ?? ""} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="cl-note" className="text-sm font-medium">
          Observações
        </label>
        <Textarea id="cl-note" name="note" defaultValue={defaults?.note ?? ""} />
      </div>

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
