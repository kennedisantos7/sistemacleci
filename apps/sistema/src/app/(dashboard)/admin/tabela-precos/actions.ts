"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceUnit } from "@cleci/db";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import {
  priceItemSchema,
  createPriceItem,
  updatePriceItem,
  setPriceItemActive,
} from "@/server/services/price-items";
import { mensagemDoErro } from "@/server/errors";

export type PriceItemFormState = { error?: string };

function parseForm(formData: FormData) {
  const priceRaw = String(formData.get("price") ?? "").trim();
  const normalized = priceRaw.includes(",")
    ? priceRaw.replace(/\./g, "").replace(",", ".")
    : priceRaw;
  const price = Number(normalized || "0");
  if (!Number.isFinite(price) || price < 0) {
    return { success: false as const, error: "Valor inválido (use o formato 123,45)." };
  }

  const unitRaw = String(formData.get("unit") ?? "");
  const unit = (Object.values(PriceUnit) as string[]).includes(unitRaw)
    ? (unitRaw as PriceUnit)
    : PriceUnit.UNIDADE;

  const parsed = priceItemSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    description: String(formData.get("description") ?? ""),
    unit,
    priceCents: Math.round(price * 100),
    group: String(formData.get("group") ?? "").trim() || null,
    active: formData.get("active") !== null,
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  return { success: true as const, data: parsed.data };
}

export async function createPriceItemAction(
  _prev: PriceItemFormState,
  formData: FormData,
): Promise<PriceItemFormState> {
  await requireUser(STAFF_ROLES);

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error };

  try {
    await createPriceItem(parsed.data);
  } catch (err) {
    return { error: mensagemDoErro(err, "Erro ao salvar o produto.") };
  }

  revalidatePath("/admin/tabela-precos");
  redirect("/admin/tabela-precos");
}

export async function updatePriceItemAction(
  _prev: PriceItemFormState,
  formData: FormData,
): Promise<PriceItemFormState> {
  await requireUser(STAFF_ROLES);
  const id = String(formData.get("priceItemId") ?? "");
  if (!id) return { error: "Produto inválido." };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error };

  try {
    await updatePriceItem(id, parsed.data);
  } catch (err) {
    return { error: mensagemDoErro(err, "Erro ao salvar o produto.") };
  }

  revalidatePath("/admin/tabela-precos");
  redirect("/admin/tabela-precos");
}

/**
 * Ativa/desativa. Nunca apaga: orçamentos antigos ficam vinculados ao produto,
 * e desativar apenas o tira da busca do vendedor.
 */
export async function togglePriceItemAction(formData: FormData): Promise<void> {
  await requireUser(STAFF_ROLES);
  const id = String(formData.get("priceItemId") ?? "");
  if (!id) return;
  const active = String(formData.get("active") ?? "") === "1";

  try {
    await setPriceItemActive(id, active);
  } catch {
    // Produto já removido — a tela recarregada mostra o estado real.
  }
  revalidatePath("/admin/tabela-precos");
}
