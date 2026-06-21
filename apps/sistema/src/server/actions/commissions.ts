"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@cleci/db";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { approveCommission, approveAllPending } from "@/server/services/commission";

export async function approveCommissionAction(formData: FormData): Promise<void> {
  const admin = await requireUser(FULL_ACCESS_ROLES);
  const commissionId = String(formData.get("commissionId") ?? "");
  if (!commissionId) return;

  await approveCommission(commissionId);
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "COMMISSION_APPROVED",
      entity: "Commission",
      entityId: commissionId,
    },
  });
  revalidatePath("/admin/saques");
}

export async function approveAllPendingAction(): Promise<void> {
  const admin = await requireUser(FULL_ACCESS_ROLES);
  const count = await approveAllPending();
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "COMMISSION_APPROVED_ALL",
      entity: "Commission",
      metadata: { count },
    },
  });
  revalidatePath("/admin/saques");
}
