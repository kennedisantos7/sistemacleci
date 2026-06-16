"use server";

import { revalidatePath } from "next/cache";
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
