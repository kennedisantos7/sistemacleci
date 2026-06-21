"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@cleci/db";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { updateConfig } from "@/server/services/config";
import { parsePercentToBps } from "@/lib/money";

export type ConfigState = { error?: string; success?: boolean };

export async function updateConfigAction(
  _prev: ConfigState,
  formData: FormData,
): Promise<ConfigState> {
  const admin = await requireUser(FULL_ACCESS_ROLES);

  const bps = parsePercentToBps(String(formData.get("defaultRate") ?? ""));
  if (bps == null) return { error: "Taxa inválida (use 0 a 100)." };

  const cookieDays = Number(formData.get("cookieDays"));
  if (![30, 60, 90].includes(cookieDays)) return { error: "Duração de cookie inválida." };

  await updateConfig({ defaultRateBps: bps, cookieDurationDays: cookieDays });
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "CONFIG_UPDATED",
      entity: "CommissionConfig",
      metadata: { defaultRateBps: bps, cookieDurationDays: cookieDays },
    },
  });

  revalidatePath("/admin/comissoes");
  return { success: true };
}

export async function updateUserRateAction(formData: FormData): Promise<void> {
  const admin = await requireUser(FULL_ACCESS_ROLES);
  const userId = String(formData.get("userId") ?? "");
  const raw = String(formData.get("rate") ?? "").trim();
  if (!userId) return;

  // Campo vazio => volta a usar a taxa global (null).
  const bps = raw === "" ? null : parsePercentToBps(raw);
  if (raw !== "" && bps == null) return;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { commissionRateBps: bps } }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "USER_RATE_UPDATED",
        entity: "User",
        entityId: userId,
        metadata: { commissionRateBps: bps },
      },
    }),
  ]);

  revalidatePath("/admin/comissoes");
}
