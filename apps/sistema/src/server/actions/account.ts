"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@cleci/db";
import { requireUser } from "@/server/session";

const schema = z
  .object({
    current: z.string().min(1, "Informe a senha atual."),
    next: z.string().min(8, "A nova senha deve ter ao menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: "As senhas não conferem.",
    path: ["confirm"],
  });

export type ChangePasswordState = { error?: string; success?: boolean };

/** Troca a própria senha (qualquer papel autenticado), validando a senha atual. */
export async function changeOwnPasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const sessionUser = await requireUser();

  const parsed = schema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) return { error: "Conta sem senha definida." };

  const ok = await bcrypt.compare(parsed.data.current, user.passwordHash);
  if (!ok) return { error: "Senha atual incorreta." };

  const passwordHash = await bcrypt.hash(parsed.data.next, 12);
  await prisma.user.update({ where: { id: sessionUser.id }, data: { passwordHash } });

  return { success: true };
}
