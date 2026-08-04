"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { BUDGET_ROLES } from "@/lib/rbac";
import {
  clientSchema,
  activitySchema,
  createClient,
  updateClient,
  deleteClient,
  claimClient,
  releaseClient,
  transferClient,
  addClientActivity,
  type ClientInput,
} from "@/server/services/clients";
import { STAFF_ROLES } from "@/lib/rbac";

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

  const client = await createClient(user, parsed.data as ClientInput);
  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}`);
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
  redirect(`/clientes/${clientId}`);
}

// --------------------------- Titularidade ---------------------------------

export type OwnershipState = { error?: string };

function revalidateClient(clientId: string) {
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
}

/** Assumir o atendimento de uma empresa livre ou com prazo vencido. */
export async function claimClientAction(
  _prev: OwnershipState,
  formData: FormData,
): Promise<OwnershipState> {
  const user = await requireUser(BUDGET_ROLES);
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Cliente inválido." };

  const error = await claimClient(user, clientId);
  if (error) return { error };
  revalidateClient(clientId);
  return {};
}

/** O titular devolve a empresa para a base. */
export async function releaseClientAction(
  _prev: OwnershipState,
  formData: FormData,
): Promise<OwnershipState> {
  const user = await requireUser(BUDGET_ROLES);
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Cliente inválido." };

  const error = await releaseClient(user, clientId);
  if (error) return { error };
  revalidateClient(clientId);
  return {};
}

/** Transferência direta — só equipe administrativa (validado aqui e no service). */
export async function transferClientAction(
  _prev: OwnershipState,
  formData: FormData,
): Promise<OwnershipState> {
  const user = await requireUser(STAFF_ROLES);
  const clientId = String(formData.get("clientId") ?? "");
  const paraUserId = String(formData.get("paraUserId") ?? "");
  if (!clientId || !paraUserId) return { error: "Selecione o vendedor de destino." };

  const error = await transferClient(user, clientId, paraUserId);
  if (error) return { error };
  revalidateClient(clientId);
  return {};
}

/** Lança um contato/atividade no histórico da empresa. */
export async function addActivityAction(
  _prev: OwnershipState,
  formData: FormData,
): Promise<OwnershipState> {
  const user = await requireUser(BUDGET_ROLES);
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Cliente inválido." };

  const parsed = activitySchema.safeParse({
    type: String(formData.get("type") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const error = await addClientActivity(user, clientId, parsed.data);
  if (error) return { error };
  revalidateClient(clientId);
  return {};
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
