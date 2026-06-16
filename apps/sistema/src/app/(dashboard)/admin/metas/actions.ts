"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@cleci/db";
import { requireUser } from "@/server/session";
import { parseReaisToCents } from "@/lib/money";
import { upsertGoal } from "@/server/services/goals";

export async function setGoalAction(formData: FormData): Promise<void> {
  const admin = await requireUser(["ADMIN"]);

  const userId = String(formData.get("userId") ?? "");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const targetCents = parseReaisToCents(String(formData.get("target") ?? ""));

  if (!userId || !Number.isInteger(year) || !Number.isInteger(month) || targetCents == null) {
    return;
  }

  await upsertGoal(userId, { year, month }, targetCents);
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "GOAL_SET",
      entity: "SalesGoal",
      entityId: userId,
      metadata: { year, month, targetCents },
    },
  });

  revalidatePath("/admin/metas");
}
