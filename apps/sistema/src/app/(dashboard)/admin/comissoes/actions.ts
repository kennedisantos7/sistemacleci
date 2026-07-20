"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@cleci/db";
import { requireUser } from "@/server/session";
import { updateConfig } from "@/server/services/config";
import { parsePercentToBps } from "@/lib/money";

export type ConfigState = { error?: string; success?: boolean };

/** Taxas fixas do programa — alteráveis somente no login DESENVOLVEDOR. */
export async function updateConfigAction(
  _prev: ConfigState,
  formData: FormData,
): Promise<ConfigState> {
  const dev = await requireUser(["DESENVOLVEDOR"]);

  const afiliadoVendaBps = parsePercentToBps(String(formData.get("afiliadoVenda") ?? ""));
  const afiliadoIndicacaoBps = parsePercentToBps(String(formData.get("afiliadoIndicacao") ?? ""));
  const desenvolvedorBps = parsePercentToBps(String(formData.get("desenvolvedor") ?? ""));

  if (afiliadoVendaBps == null || afiliadoIndicacaoBps == null || desenvolvedorBps == null) {
    return { error: "Taxa inválida (use 0 a 100)." };
  }

  const cookieDays = Number(formData.get("cookieDays"));
  if (![30, 60, 90].includes(cookieDays)) return { error: "Duração de cookie inválida." };

  const data = {
    afiliadoVendaBps,
    afiliadoIndicacaoBps,
    desenvolvedorBps,
    cookieDurationDays: cookieDays,
  };

  await updateConfig(data);
  await prisma.auditLog.create({
    data: {
      actorId: dev.id,
      action: "CONFIG_UPDATED",
      entity: "CommissionConfig",
      metadata: data,
    },
  });

  revalidatePath("/admin/comissoes");
  return { success: true };
}
