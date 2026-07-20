"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@cleci/db";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES, EARNER_ROLES } from "@/lib/rbac";
import { requestPayout, approvePayout, payPayout, rejectPayout } from "@/server/services/payouts";

async function audit(actorId: string, action: string, payoutId: string, metadata?: object) {
  await prisma.auditLog.create({
    data: { actorId, action, entity: "Payout", entityId: payoutId, metadata: metadata ?? {} },
  });
}

export type PayoutRequestState = { error?: string; success?: boolean };

// --- Afiliado ---
export async function requestPayoutAction(
  _prev: PayoutRequestState,
  _formData: FormData,
): Promise<PayoutRequestState> {
  const user = await requireUser(EARNER_ROLES);
  try {
    const payout = await requestPayout(user.id);
    await audit(user.id, "PAYOUT_REQUESTED", payout.id, { amountCents: payout.amountCents });
    revalidatePath("/afiliado/saques");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao solicitar saque." };
  }
}

// --- Admin ---
export async function approvePayoutAction(formData: FormData): Promise<void> {
  const admin = await requireUser(FULL_ACCESS_ROLES);
  const payoutId = String(formData.get("payoutId") ?? "");
  if (!payoutId) return;
  await approvePayout(payoutId);
  await audit(admin.id, "PAYOUT_APPROVED", payoutId);
  revalidatePath("/admin/saques");
}

export async function payPayoutAction(formData: FormData): Promise<void> {
  const admin = await requireUser(FULL_ACCESS_ROLES);
  const payoutId = String(formData.get("payoutId") ?? "");
  if (!payoutId) return;
  await payPayout(payoutId, { method: "pix" });
  await audit(admin.id, "PAYOUT_PAID", payoutId);
  revalidatePath("/admin/saques");
}

export async function rejectPayoutAction(formData: FormData): Promise<void> {
  const admin = await requireUser(FULL_ACCESS_ROLES);
  const payoutId = String(formData.get("payoutId") ?? "");
  if (!payoutId) return;
  const note = String(formData.get("note") ?? "") || undefined;
  await rejectPayout(payoutId, note);
  await audit(admin.id, "PAYOUT_REJECTED", payoutId, { note });
  revalidatePath("/admin/saques");
}
