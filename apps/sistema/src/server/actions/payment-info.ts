"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@cleci/db";
import { requireUser } from "@/server/session";

const schema = z.object({
  pixKey: z.string().max(140).optional(),
  document: z.string().max(40).optional(),
  bankName: z.string().max(80).optional(),
});

export type PaymentInfoState = { error?: string; success?: boolean };

export async function updatePaymentInfoAction(
  _prev: PaymentInfoState,
  formData: FormData,
): Promise<PaymentInfoState> {
  const user = await requireUser(["AFILIADO", "VENDEDOR_FIXO"]);

  const parsed = schema.safeParse({
    pixKey: formData.get("pixKey") || undefined,
    document: formData.get("document") || undefined,
    bankName: formData.get("bankName") || undefined,
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.paymentInfo.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: { userId: user.id, ...parsed.data },
  });

  revalidatePath("/afiliado/saques");
  return { success: true };
}
