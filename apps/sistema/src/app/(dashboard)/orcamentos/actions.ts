"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BudgetDocType } from "@cleci/db";
import { requireUser } from "@/server/session";
import { BUDGET_ROLES } from "@/lib/rbac";
import {
  budgetItemsSchema,
  budgetAdjustmentsSchema,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetForActor,
  markBudgetSent,
  markBudgetAccepted,
  markBudgetRejected,
  markBudgetSaleFinalized,
  revertBudgetToDraft,
  type BudgetAdjustmentsInput,
  type BudgetHeaderInput,
  type BudgetItemInput,
} from "@/server/services/budgets";
import { searchPriceItems, type PriceItemOption } from "@/server/services/price-items";
import {
  validarFormaPagamento,
  validarPrazoEntrega,
  validarCidadeEntrega,
} from "@/lib/budget-options";
import { mensagemDoErro } from "@/server/errors";

export type BudgetFormState = { error?: string };

/** Valores já gravados no orçamento em edição, para não perder dado legado. */
type ValoresAtuais = {
  paymentTerms?: string | null;
  deliveryForecast?: string | null;
};

function parseHeader(
  formData: FormData,
  atuais: ValoresAtuais = {},
): BudgetHeaderInput | { error: string } {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Selecione o cliente." };

  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const title = text("title");
  const note = text("note");
  if (title.length > 160) return { error: "Título muito longo." };
  if (note.length > 1000) return { error: "Observações muito longas." };

  const docType =
    text("docType") === BudgetDocType.PEDIDO ? BudgetDocType.PEDIDO : BudgetDocType.ORCAMENTO;

  const validUntilRaw = text("validUntil");
  let validUntil: Date | null = null;
  if (validUntilRaw) {
    const d = new Date(`${validUntilRaw}T23:59:59`);
    if (Number.isNaN(d.getTime())) return { error: "Data de validade inválida." };
    validUntil = d;
  }

  return {
    clientId,
    docType,
    title: title || null,
    note: note || null,
    validUntil,
    // Listas fechadas: o que não está na lista (e não é o valor já gravado)
    // vira null, em vez de aceitar qualquer texto vindo da requisição.
    paymentTerms: validarFormaPagamento(text("paymentTerms"), atuais.paymentTerms),
    deliveryForecast: validarPrazoEntrega(text("deliveryForecast"), atuais.deliveryForecast),
    deliveryCity: validarCidadeEntrega(text("deliveryCity")),
  };
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

function parseAdjustments(formData: FormData): BudgetAdjustmentsInput | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("adjustmentsJson") ?? "{}"));
  } catch {
    return { error: "Desconto/frete inválidos." };
  }
  const parsed = budgetAdjustmentsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Confira desconto, adicional, frete e imposto.",
    };
  }
  return parsed.data;
}

export async function createBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser(BUDGET_ROLES);

  const header = parseHeader(formData);
  if ("error" in header) return header;
  const items = parseItems(formData);
  if ("error" in items) return items;
  const adjustments = parseAdjustments(formData);
  if ("error" in adjustments) return adjustments;

  let budgetId: string;
  try {
    const budget = await createBudget(user, header, items, adjustments);
    budgetId = budget.id;
  } catch (err) {
    return { error: mensagemDoErro(err, "Erro ao salvar o orçamento.") };
  }

  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${budgetId}`);
}

export async function updateBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return { error: "Orçamento inválido." };

  // Lê o que já está gravado (respeitando o escopo do papel) para que valores
  // antigos de texto livre sobrevivam à validação por lista.
  const atual = await getBudgetForActor(user, budgetId);
  if (!atual) return { error: "Orçamento não encontrado." };

  const header = parseHeader(formData, {
    paymentTerms: atual.paymentTerms,
    deliveryForecast: atual.deliveryForecast,
  });
  if ("error" in header) return header;
  const items = parseItems(formData);
  if ("error" in items) return items;
  const adjustments = parseAdjustments(formData);
  if ("error" in adjustments) return adjustments;

  try {
    await updateBudget(user, budgetId, header, items, adjustments);
  } catch (err) {
    return { error: mensagemDoErro(err, "Erro ao salvar o orçamento.") };
  }

  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${budgetId}`);
  redirect(`/orcamentos/${budgetId}`);
}

/** Busca de produtos da tabela de preços (autocomplete do formulário). */
export async function searchPriceItemsAction(search: string): Promise<PriceItemOption[]> {
  await requireUser(BUDGET_ROLES);
  return searchPriceItems(search, 20);
}

// --- Transições de status (usadas com ConfirmSubmitButton / forms simples) ---

function revalidateBudget(budgetId: string) {
  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${budgetId}`);
  revalidatePath("/vendedor");
  revalidatePath("/admin");
}

export async function sendBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await markBudgetSent(user, budgetId);
  } catch {
    // Transição inválida (ex.: duplo clique) — estado atual já reflete na tela.
  }
  revalidateBudget(budgetId);
}

export async function revertBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await revertBudgetToDraft(user, budgetId);
  } catch {
    // idem
  }
  revalidateBudget(budgetId);
}

export async function acceptBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await markBudgetAccepted(user, budgetId);
  } catch {
    // idem — idempotência garantida no service
  }
  revalidateBudget(budgetId);
}

export async function rejectBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await markBudgetRejected(user, budgetId);
  } catch {
    // idem
  }
  revalidateBudget(budgetId);
}

export async function finalizeBudgetSaleAction(formData: FormData): Promise<void> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await markBudgetSaleFinalized(user, budgetId);
  } catch {
    // idem
  }
  revalidateBudget(budgetId);
}

export async function deleteBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return;
  try {
    await deleteBudget(user, budgetId);
  } catch {
    // idem — só rascunho é excluível
  }
  revalidatePath("/orcamentos");
  redirect("/orcamentos");
}
