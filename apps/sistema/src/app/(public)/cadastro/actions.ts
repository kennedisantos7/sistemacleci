"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, Role, UserStatus } from "@cleci/db";

const schema = z
  .object({
    name: z.string().min(2, "Informe seu nome.").max(120),
    email: z.string().email("E-mail inválido."),
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não conferem.",
    path: ["confirm"],
  });

export type SignupState = { error?: string; success?: boolean };

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe uma conta com este e-mail." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: Role.AFILIADO,
      status: UserStatus.PENDENTE, // aguarda aprovação do admin
    },
  });

  return { success: true };
}
