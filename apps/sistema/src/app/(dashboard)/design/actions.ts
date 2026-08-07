"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { BUDGET_ROLES, DESIGN_ROLES } from "@/lib/rbac";
import {
  requestDesign,
  cancelDesign,
  claimDesign,
  deliverDesign,
  requestRevision,
  approveArt,
} from "@/server/services/design";

export type DesignState = { error?: string };

function revalidar(budgetId: string) {
  revalidatePath("/design");
  revalidatePath(`/orcamentos/${budgetId}`);
  revalidatePath("/orcamentos");
}

function texto(formData: FormData, key: string, max = 2000): string | null {
  const v = String(formData.get(key) ?? "").trim();
  if (!v) return null;
  return v.slice(0, max);
}

// --- Vendedor -------------------------------------------------------------

/** Envia o orçamento para o design. Opcional: não altera o status da venda. */
export async function requestDesignAction(
  _prev: DesignState,
  formData: FormData,
): Promise<DesignState> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return { error: "Orçamento inválido." };

  const error = await requestDesign(user, budgetId, texto(formData, "brief"));
  if (error) return { error };
  revalidar(budgetId);
  return {};
}

export async function cancelDesignAction(
  _prev: DesignState,
  formData: FormData,
): Promise<DesignState> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return { error: "Orçamento inválido." };

  const error = await cancelDesign(user, budgetId);
  if (error) return { error };
  revalidar(budgetId);
  return {};
}

export async function requestRevisionAction(
  _prev: DesignState,
  formData: FormData,
): Promise<DesignState> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return { error: "Orçamento inválido." };

  const error = await requestRevision(user, budgetId, texto(formData, "motivo"));
  if (error) return { error };
  revalidar(budgetId);
  return {};
}

export async function approveArtAction(
  _prev: DesignState,
  formData: FormData,
): Promise<DesignState> {
  const user = await requireUser(BUDGET_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return { error: "Orçamento inválido." };

  const error = await approveArt(user, budgetId);
  if (error) return { error };
  revalidar(budgetId);
  return {};
}

// --- Design ---------------------------------------------------------------

export async function claimDesignAction(
  _prev: DesignState,
  formData: FormData,
): Promise<DesignState> {
  const user = await requireUser(DESIGN_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return { error: "Orçamento inválido." };

  const error = await claimDesign(user, budgetId);
  if (error) return { error };
  revalidar(budgetId);
  return {};
}

export async function deliverDesignAction(
  _prev: DesignState,
  formData: FormData,
): Promise<DesignState> {
  const user = await requireUser(DESIGN_ROLES);
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!budgetId) return { error: "Orçamento inválido." };

  const error = await deliverDesign(user, budgetId, texto(formData, "nota"));
  if (error) return { error };
  revalidar(budgetId);
  return {};
}
