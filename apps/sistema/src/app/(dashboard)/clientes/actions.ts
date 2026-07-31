"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { BUDGET_ROLES } from "@/lib/rbac";
import {
  clientSchema,
  createClient,
  updateClient,
  deleteClient,
  type ClientInput,
} from "@/server/services/clients";

export type ClientFormState = { error?: string };

function parseClientForm(formData: FormData) {
  const text = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value || undefined;
  };
  return clientSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    companyName: text("companyName"),
    document: text("document"),
    email: text("email"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    contactName: text("contactName"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    note: text("note"),
  });
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser(BUDGET_ROLES);

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await createClient(user, parsed.data as ClientInput);
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function updateClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser(BUDGET_ROLES);
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Cliente inválido." };

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateClient(user, clientId, parsed.data as ClientInput);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." };
  }
  revalidatePath("/clientes");
  redirect("/clientes");
}

export type DeleteClientState = { error?: string };

export async function deleteClientAction(
  _prev: DeleteClientState,
  formData: FormData,
): Promise<DeleteClientState> {
  const user = await requireUser(BUDGET_ROLES);
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Cliente inválido." };

  const error = await deleteClient(user, clientId);
  if (error) return { error };

  revalidatePath("/clientes");
  redirect("/clientes");
}

/**
 * Cadastro rápido a partir da tela de orçamento (dialog) — devolve o cliente
 * criado para o formulário já selecioná-lo, sem navegar para fora.
 */
export type QuickClientState = {
  error?: string;
  client?: { id: string; name: string; companyName: string | null };
};

export async function quickCreateClientAction(
  _prev: QuickClientState,
  formData: FormData,
): Promise<QuickClientState> {
  const user = await requireUser(BUDGET_ROLES);

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const client = await createClient(user, parsed.data as ClientInput);
    revalidatePath("/clientes");
    return {
      client: { id: client.id, name: client.name, companyName: client.companyName },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao cadastrar o cliente." };
  }
}
