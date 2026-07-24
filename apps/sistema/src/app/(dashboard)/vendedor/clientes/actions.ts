"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { createClient, updateClient, deleteClient } from "@/server/services/clients";

const clientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  companyName: z.string().trim().max(120).optional(),
  document: z.string().trim().max(20).optional(),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  note: z.string().trim().max(500).optional(),
});

export type ClientFormState = { error?: string };

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName") || undefined,
    document: formData.get("document") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    note: formData.get("note") || undefined,
  });
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser(["VENDEDOR_FIXO"]);

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await createClient(user.id, { ...parsed.data, email: parsed.data.email || null });
  revalidatePath("/vendedor/clientes");
  redirect("/vendedor/clientes");
}

export async function updateClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Cliente inválido." };

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateClient(user.id, clientId, { ...parsed.data, email: parsed.data.email || null });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." };
  }
  revalidatePath("/vendedor/clientes");
  redirect("/vendedor/clientes");
}

export type DeleteClientState = { error?: string };

export async function deleteClientAction(
  _prev: DeleteClientState,
  formData: FormData,
): Promise<DeleteClientState> {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Cliente inválido." };

  const error = await deleteClient(user.id, clientId);
  if (error) return { error };

  revalidatePath("/vendedor/clientes");
  redirect("/vendedor/clientes");
}
