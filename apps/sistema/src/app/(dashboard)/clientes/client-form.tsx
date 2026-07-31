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
  whatsapp?: string | null;
  contactName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  note?: string | null;
};

/** Campos do cliente — reaproveitados pelo cadastro rápido do orçamento. */
export function ClientFields({ defaults }: { defaults?: ClientDefaults }) {
  return (
    <>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="cl-name" className="text-sm font-medium">
          Razão social / Nome *
        </label>
        <Input id="cl-name" name="name" required defaultValue={defaults?.name ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-company" className="text-sm font-medium">
          Nome fantasia
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
        <label htmlFor="cl-contact" className="text-sm font-medium">
          Contato
        </label>
        <Input id="cl-contact" name="contactName" defaultValue={defaults?.contactName ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="cl-email" name="email" type="email" defaultValue={defaults?.email ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-phone" className="text-sm font-medium">
          Telefone
        </label>
        <Input id="cl-phone" name="phone" defaultValue={defaults?.phone ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-whatsapp" className="text-sm font-medium">
          WhatsApp
        </label>
        <Input id="cl-whatsapp" name="whatsapp" defaultValue={defaults?.whatsapp ?? ""} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="cl-address" className="text-sm font-medium">
          Endereço
        </label>
        <Input id="cl-address" name="address" defaultValue={defaults?.address ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-city" className="text-sm font-medium">
          Cidade
        </label>
        <Input id="cl-city" name="city" defaultValue={defaults?.city ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-state" className="text-sm font-medium">
          Estado
        </label>
        <Input id="cl-state" name="state" defaultValue={defaults?.state ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="cl-zip" className="text-sm font-medium">
          CEP
        </label>
        <Input id="cl-zip" name="zip" defaultValue={defaults?.zip ?? ""} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="cl-note" className="text-sm font-medium">
          Observações
        </label>
        <Textarea id="cl-note" name="note" defaultValue={defaults?.note ?? ""} />
      </div>
    </>
  );
}

export function ClientForm({ defaults }: { defaults?: ClientDefaults }) {
  const isEdit = Boolean(defaults?.id);
  const [state, action, pending] = useActionState(
    isEdit ? updateClientAction : createClientAction,
    initial,
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {isEdit ? <input type="hidden" name="clientId" value={defaults!.id} /> : null}

      <ClientFields defaults={defaults} />

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
