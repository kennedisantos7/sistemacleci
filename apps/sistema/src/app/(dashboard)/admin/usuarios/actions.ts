"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, UserStatus, Role } from "@cleci/db";
import { requireUser } from "@/server/session";

async function setUserStatus(targetId: string, status: UserStatus, action: string) {
  const admin = await requireUser(["ADMIN"]);
  if (targetId === admin.id) return; // admin não altera o próprio status

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action,
        entity: "User",
        entityId: targetId,
        metadata: { status },
      },
    }),
  ]);

  revalidatePath("/admin/usuarios");
}

export async function approveUserAction(formData: FormData) {
  await setUserStatus(String(formData.get("userId")), UserStatus.ATIVO, "USER_APPROVED");
}

export async function blockUserAction(formData: FormData) {
  await setUserStatus(String(formData.get("userId")), UserStatus.BLOQUEADO, "USER_BLOCKED");
}

export async function unblockUserAction(formData: FormData) {
  await setUserStatus(String(formData.get("userId")), UserStatus.ATIVO, "USER_UNBLOCKED");
}

const ROLES: Role[] = [Role.ADMIN, Role.VENDEDOR_FIXO, Role.AFILIADO];

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "VENDEDOR_FIXO", "AFILIADO"]),
});

export type CreateUserState = { error?: string; success?: string };

/** Admin cria um login diretamente (ex.: Vendedor Fixo), já ATIVO. */
export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const admin = await requireUser(["ADMIN"]);

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: "Dados inválidos (senha mín. 8 caracteres)." };
  }

  const { name, email, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Já existe uma conta com este e-mail." };

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, status: UserStatus.ATIVO },
  });
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "USER_CREATED",
      entity: "User",
      entityId: user.id,
      metadata: { role },
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: `Login criado para ${email} (${role}).` };
}

export async function resetPasswordAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId || password.length < 8) return;
  if (userId === admin.id) return; // admin troca a própria senha em /conta

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.auditLog.create({
      data: { actorId: admin.id, action: "USER_PASSWORD_RESET", entity: "User", entityId: userId },
    }),
  ]);
  revalidatePath("/admin/usuarios");
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const targetId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;
  if (!targetId || !ROLES.includes(role)) return;
  if (targetId === admin.id) return; // admin não muda o próprio papel

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetId }, data: { role } }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "USER_ROLE_CHANGED",
        entity: "User",
        entityId: targetId,
        metadata: { role },
      },
    }),
  ]);

  revalidatePath("/admin/usuarios");
}
