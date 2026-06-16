"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUserAction, type CreateUserState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: CreateUserState = {};

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="cu-name" className="text-sm font-medium">
          Nome
        </label>
        <Input id="cu-name" name="name" required />
      </div>
      <div className="space-y-1">
        <label htmlFor="cu-email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="cu-email" name="email" type="email" required autoComplete="off" />
      </div>
      <div className="space-y-1">
        <label htmlFor="cu-password" className="text-sm font-medium">
          Senha provisória
        </label>
        <Input id="cu-password" name="password" type="text" required autoComplete="off" placeholder="mín. 8 caracteres" />
      </div>
      <div className="space-y-1">
        <label htmlFor="cu-role" className="text-sm font-medium">
          Papel
        </label>
        <select
          id="cu-role"
          name="role"
          defaultValue="VENDEDOR_FIXO"
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="VENDEDOR_FIXO">Vendedor</option>
          <option value="AFILIADO">Afiliado</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-green-700 sm:col-span-2">
          {state.success} Anote e repasse a senha — ela não será exibida de novo.
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar login"}
        </Button>
      </div>
    </form>
  );
}
