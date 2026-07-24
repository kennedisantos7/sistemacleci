"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import {
  budgetItemsSchema,
  createBudget,
  updateBudget,
  markBudgetSent,
  markBudgetAccepted,
  markBudgetRejected,
  markBudgetSaleFinalized,
  revertBudgetToDraft,
  type BudgetHeaderInput,
  type BudgetItemInput,
} from "@/server/services/budgets";

export type BudgetFormState = { error?: string };

function parseHeader(formData: FormData): BudgetHeaderInput | { error: string } {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Selecione o cliente." };

  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (title.length > 160) return { error: "Título muito longo." };
  if (note.length > 1000) return { error: "Observações muito longas." };

  const validUntilRaw = String(formData.get("validUntil") ?? "").trim();
  let validUntil: Date | null = null;
  if (validUntilRaw) {
    const d = new Date(`${validUntilRaw}T23:59:59`);
    if (Number.isNaN(d.getTime())) return { error: "Data de validade inválida." };
    validUntil = d;
  }

  return { clientId, title: title || null, note: note || null, validUntil };
}

function parseItems(formData: FormData): BudgetItemInput[] | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { error: "Itens inválidos." };
  }
  const parsed = budgetItemsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Confira os itens: descrição, quantidade e preço são obrigatórios.",
    };
  }
  return parsed.data;
}

export async function createBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser(["VENDEDOR_FIXO"]);

  const header = parseHeader(formData);
  if ("error" in header) return header;
  const items = parseItems(formData);
  if ("error" in items) return items;

  let budgetId: string;
  try {
    const budget = await createBudget(user.id, header, items);
    budgetId = budget.id;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar o orçamento." };
  }

  revalidatePath("/vendedor/orcamentos");
  redirect(`/vendedor/orcamentos/${budgetId}`);
}

export async function updateBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return { error: "Orçamento inválido." };

  const header = parseHeader(formData);
  if ("error" in header) return header;
  const items = parseItems(formData);
  if ("error" in items) return items;

  try {
    await updateBudget(user.id, budgetId, header, items);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar o orçamento." };
  }

  revalidatePath("/vendedor/orcamentos");
  revalidatePath(`/vendedor/orcamentos/${budgetId}`);
  redirect(`/vendedor/orcamentos/${budgetId}`);
}

// --- Transições de status (usadas com ConfirmSubmitButton / forms simples) ---

function revalidateBudget(budgetId: string) {
  revalidatePath("/vendedor/orcamentos");
  revalidatePath(`/vendedor/orcamentos/${budgetId}`);
  revalidatePath("/vendedor");
}

export async function sendBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await markBudgetSent(user.id, budgetId);
  } catch {
    // Transição inválida (ex.: duplo clique) — estado atual já reflete na tela.
  }
  revalidateBudget(budgetId);
}

export async function revertBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await revertBudgetToDraft(user.id, budgetId);
  } catch {
    // idem
  }
  revalidateBudget(budgetId);
}

export async function acceptBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await markBudgetAccepted(user.id, budgetId);
  } catch {
    // idem — idempotência garantida no service
  }
  revalidateBudget(budgetId);
}

export async function rejectBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await markBudgetRejected(user.id, budgetId);
  } catch {
    // idem
  }
  revalidateBudget(budgetId);
}

export async function finalizeBudgetSaleAction(formData: FormData): Promise<void> {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await markBudgetSaleFinalized(user.id, budgetId);
  } catch {
    // idem
  }
  revalidateBudget(budgetId);
}
