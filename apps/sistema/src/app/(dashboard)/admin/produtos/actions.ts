"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { parseReaisToCents } from "@/lib/money";
import { createProduct, updateProduct, deleteProduct } from "@/server/services/products";

const stringArray = z.array(z.string().trim().min(1)).max(50);

const productSchema = z.object({
  categoryId: z.string().min(1, "Selecione a categoria."),
  subcategoryId: z.string().optional(),
  title: z.string().trim().min(2, "Informe o título.").max(160),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().url("Envie a imagem principal."),
  gallery: stringArray,
  sizes: stringArray,
  codes: stringArray,
  badge: z.string().trim().max(40).optional(),
  code: z.string().trim().max(60).optional(),
  active: z.boolean(),
});

export type ProductFormState = { error?: string };

function jsonArray(formData: FormData, field: string): unknown {
  try {
    return JSON.parse(String(formData.get(field) ?? "[]"));
  } catch {
    return null;
  }
}

function parseForm(formData: FormData) {
  const priceRaw = String(formData.get("price") ?? "").trim();
  let priceCents: number | null = null;
  if (priceRaw) {
    priceCents = parseReaisToCents(priceRaw);
    if (priceCents == null) return { error: "Preço inválido. Use o formato 123,45." as string };
  }

  const parsed = productSchema.safeParse({
    categoryId: formData.get("categoryId"),
    subcategoryId: formData.get("subcategoryId") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    imageUrl: formData.get("imageUrl") || "",
    gallery: jsonArray(formData, "gallery"),
    sizes: jsonArray(formData, "sizes"),
    codes: jsonArray(formData, "codes"),
    badge: formData.get("badge") || undefined,
    code: formData.get("code") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;
  return {
    data: {
      categoryId: d.categoryId,
      subcategoryId: d.subcategoryId || null,
      title: d.title,
      description: d.description || null,
      priceCents,
      imageUrl: d.imageUrl,
      gallery: d.gallery,
      sizes: d.sizes,
      codes: d.codes,
      badge: d.badge || null,
      code: d.code || null,
      active: d.active,
    },
  };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireUser(STAFF_ROLES);
  const result = parseForm(formData);
  if ("error" in result) return { error: result.error };

  try {
    await createProduct(result.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." };
  }
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireUser(STAFF_ROLES);
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Produto inválido." };

  const result = parseForm(formData);
  if ("error" in result) return { error: result.error };

  try {
    await updateProduct(productId, result.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar." };
  }
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireUser(STAFF_ROLES);
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;
  try {
    await deleteProduct(productId);
  } catch {
    // ignora (ex.: já removido)
  }
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}
