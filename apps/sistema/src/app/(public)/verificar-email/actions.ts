"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { rateLimit } from "@/server/security";
import { resendVerificationEmail } from "@/server/services/email-verification";

export type ResendState = { error?: string; sent?: boolean };

const schema = z.object({ email: z.string().email("E-mail inválido.") });

export async function resendVerificationAction(
  _prev: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido." };
  }

  // Anti-abuso: 3 reenvios a cada 10 min por IP (o e-mail sai do nosso domínio,
  // então spam daqui queima a reputação de envio).
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`resend-verify:${ip}`, 3, 600_000)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
  }

  await resendVerificationEmail(parsed.data.email);

  // Resposta idêntica exista ou não a conta — não revelamos quem é cadastrado.
  return { sent: true };
}
