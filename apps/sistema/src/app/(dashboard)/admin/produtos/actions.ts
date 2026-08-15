"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceUnit } from "@cleci/db";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import {
  priceItemSchema,
  createPriceItem,
  updatePriceItem,
  setPriceItemActive,
} from "@/server/services/price-items";
import { publishToSite, unpublishFromSite } from "@/server/services/catalog-publish";
import { mensagemDoErro } from "@/server/errors";
import { parseReaisToCentsAllowZero } from "@/lib/money";

export type PriceItemFormState = { error?: string };

function ehUnidade(v: string): v is PriceUnit {
  return (Object.values(PriceUnit) as string[]).includes(v);
}

/** A seção Produtos vive em duas telas; salvar mexe nas duas. */
function revalidarProdutos() {
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/site");
}

function parseForm(formData: FormData) {
  // O formulário manda as linhas de preço em JSON — quantidade variável.
  let cru: unknown;
  try {
    cru = JSON.parse(String(formData.get("pricesJson") ?? "[]"));
  } catch {
    return { success: false as const, error: "Valores inválidos." };
  }
  if (!Array.isArray(cru) || cru.length === 0) {
    return { success: false as const, error: "Informe pelo menos um valor de venda." };
  }

  const prices: Array<{ unit: PriceUnit; priceCents: number }> = [];
  for (const linha of cru) {
    const unidade = String((linha as { unit?: unknown }).unit ?? "");
    if (!ehUnidade(unidade)) {
      return { success: false as const, error: "Unidade de venda inválida." };
    }
    const centavos = parseReaisToCentsAllowZero(String((linha as { valor?: unknown }).valor ?? ""));
    if (centavos === null) {
      return { success: false as const, error: "Valor inválido (use o formato 1.234,56)." };
    }
    prices.push({ unit: unidade, priceCents: centavos });
  }

  const unitRaw = String(formData.get("unit") ?? "");
  const unit = ehUnidade(unitRaw) ? unitRaw : prices[0]!.unit;

  const parsed = priceItemSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    description: String(formData.get("description") ?? ""),
    unit,
    prices,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    categoryId: String(formData.get("categoryId") ?? "").trim() || null,
    subcategoryId: String(formData.get("subcategoryId") ?? "").trim() || null,
    active: formData.get("active") !== null,
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  return {
    success: true as const,
    data: parsed.data,
    /** Chave "Subir no site" — tratada depois de salvar o cadastro. */
    noSite: formData.get("noSite") !== null,
  };
}

export async function createPriceItemAction(
  _prev: PriceItemFormState,
  formData: FormData,
): Promise<PriceItemFormState> {
  await requireUser(FULL_ACCESS_ROLES);

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error };

  try {
    const criado = await createPriceItem(parsed.data);
    if (parsed.noSite) await publishToSite(criado.id);
  } catch (err) {
    return { error: mensagemDoErro(err, "Erro ao salvar o produto.") };
  }

  revalidarProdutos();
  redirect("/admin/produtos");
}

export async function updatePriceItemAction(
  _prev: PriceItemFormState,
  formData: FormData,
): Promise<PriceItemFormState> {
  await requireUser(FULL_ACCESS_ROLES);
  const id = String(formData.get("priceItemId") ?? "");
  if (!id) return { error: "Produto inválido." };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error };

  try {
    await updatePriceItem(id, parsed.data);
    // A chave manda: ligada publica (ou republica), desligada tira do ar.
    // Publicar já reescreve título, preço, foto e categoria na vitrine, então
    // editar o cadastro de um produto publicado o mantém em dia.
    if (parsed.noSite) await publishToSite(id);
    else await unpublishFromSite(id);
  } catch (err) {
    return { error: mensagemDoErro(err, "Erro ao salvar o produto.") };
  }

  revalidarProdutos();
  redirect("/admin/produtos");
}

/**
 * Ativa/desativa o produto no orçamento. Nunca apaga: orçamentos antigos ficam
 * vinculados ao produto, e desativar apenas o tira da busca do vendedor.
 */
export async function togglePriceItemAction(formData: FormData): Promise<void> {
  await requireUser(FULL_ACCESS_ROLES);
  const id = String(formData.get("priceItemId") ?? "");
  if (!id) return;
  const active = String(formData.get("active") ?? "") === "1";

  try {
    await setPriceItemActive(id, active);
    // Produto fora da tabela não fica exposto na vitrine.
    if (!active) await unpublishFromSite(id);
  } catch {
    // Produto já removido — a tela recarregada mostra o estado real.
  }
  revalidarProdutos();
}

/** Chave "Subir no site" acionada direto da lista, sem abrir o cadastro. */
export async function toggleSiteAction(formData: FormData): Promise<void> {
  await requireUser(FULL_ACCESS_ROLES);
  const id = String(formData.get("priceItemId") ?? "");
  if (!id) return;
  const publicar = String(formData.get("noSite") ?? "") === "1";

  try {
    if (publicar) await publishToSite(id);
    else await unpublishFromSite(id);
  } catch {
    // Falta foto ou categoria: o aviso completo aparece ao abrir o cadastro,
    // que é onde dá para resolver.
  }
  revalidarProdutos();
}
