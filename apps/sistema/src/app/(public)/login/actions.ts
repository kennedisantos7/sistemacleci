"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { rateLimit } from "@/server/security";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // Anti força-bruta: 5 tentativas/min por IP+e-mail.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`login:${ip}:${email.toLowerCase()}`, 5, 60_000)) {
    return { error: "Muitas tentativas. Aguarde 1 minuto e tente novamente." };
  }

  try {
    // redirectTo é resolvido pelo callback `authorized` conforme a role.
    await signIn("credentials", { email, password, redirectTo: "/" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos, ou conta não ativada." };
    }
    // Re-lança o redirect interno do Next.js.
    throw error;
  }
}
