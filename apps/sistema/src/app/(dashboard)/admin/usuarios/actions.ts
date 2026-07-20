"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, UserStatus, Role } from "@cleci/db";
import { requireUser } from "@/server/session";
import { STAFF_ROLES, SELLER_ROLES, isFullAccess } from "@/lib/rbac";

/**
 * Regra de gestão: admin/desenvolvedor gerenciam qualquer conta; gerente só
 * pode gerenciar vendedores e afiliados (nunca contas da equipe). Retorna true
 * se `actorRole` pode agir sobre uma conta de `targetRole`.
 */
function canManageTarget(actorRole: Role, targetRole: Role): boolean {
  if (isFullAccess(actorRole)) return true;
  return SELLER_ROLES.includes(targetRole); // gerente: só vendedor/afiliado
}

// Só existe 1 conta de ADMIN e 1 de DESENVOLVEDOR no sistema.
const SINGLETON_ROLES: Role[] = [Role.ADMIN, Role.DESENVOLVEDOR];

/** Já existe uma conta com esse papel (diferente de `excludeUserId`)? */
async function singletonRoleTaken(role: Role, excludeUserId?: string): Promise<boolean> {
  if (!SINGLETON_ROLES.includes(role)) return false;
  const count = await prisma.user.count({
    where: { role, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
  });
  return count > 0;
}

async function setUserStatus(targetId: string, status: UserStatus, action: string) {
  const admin = await requireUser(STAFF_ROLES);
  if (targetId === admin.id) return; // admin não altera o próprio status

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
  if (!target || !canManageTarget(admin.role, target.role)) return;

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

const ALL_ROLES: Role[] = [
  Role.ADMIN,
  Role.DESENVOLVEDOR,
  Role.GERENTE,
  Role.VENDEDOR_FIXO,
  Role.AFILIADO,
];

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "DESENVOLVEDOR", "GERENTE", "VENDEDOR_FIXO", "AFILIADO"]),
});

export type CreateUserState = { error?: string; success?: string };

/** Admin/desenvolvedor cria qualquer login; gerente só vendedor/afiliado. */
export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const admin = await requireUser(STAFF_ROLES);

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

  // Gerente não pode criar contas da equipe (anti-escalada de privilégio).
  if (!isFullAccess(admin.role) && !SELLER_ROLES.includes(role)) {
    return { error: "Você só pode criar contas de vendedor ou afiliado." };
  }

  // Só pode existir 1 conta de ADMIN e 1 de DESENVOLVEDOR.
  if (await singletonRoleTaken(role)) {
    return { error: `Já existe uma conta de ${role === Role.ADMIN ? "admin" : "desenvolvedor"}.` };
  }

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

export type ResetPasswordState = { error?: string; success?: string };

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const admin = await requireUser(STAFF_ROLES);
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId) return { error: "Usuário inválido." };
  if (password.length < 8) return { error: "A senha deve ter ao menos 8 caracteres." };
  if (userId === admin.id) return { error: "Troque sua própria senha em Minha conta." };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target || !canManageTarget(admin.role, target.role)) {
    return { error: "Você não pode gerenciar esta conta." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.auditLog.create({
      data: { actorId: admin.id, action: "USER_PASSWORD_RESET", entity: "User", entityId: userId },
    }),
  ]);
  revalidatePath("/admin/usuarios");
  return { success: "Senha atualizada." };
}

export type DeleteUserState = { error?: string };

/**
 * Exclui permanentemente uma conta. Nunca exclui quem já tem vendas,
 * comissões ou saques registrados — isso apagaria o rastro financeiro.
 * Nesses casos, oriente a bloquear a conta em vez de excluir.
 */
export async function deleteUserAction(
  _prev: DeleteUserState,
  formData: FormData,
): Promise<DeleteUserState> {
  const admin = await requireUser(STAFF_ROLES);
  const targetId = String(formData.get("userId") ?? "");
  if (!targetId) return { error: "Usuário inválido." };
  if (targetId === admin.id) return { error: "Você não pode excluir sua própria conta." };

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { role: true, email: true },
  });
  if (!target) return { error: "Conta não encontrada." };
  if (!canManageTarget(admin.role, target.role)) {
    return { error: "Você não pode gerenciar esta conta." };
  }

  const [saleCount, commissionCount, payoutCount] = await Promise.all([
    prisma.sale.count({ where: { userId: targetId } }),
    prisma.commission.count({ where: { userId: targetId } }),
    prisma.payout.count({ where: { userId: targetId } }),
  ]);
  if (saleCount > 0 || commissionCount > 0 || payoutCount > 0) {
    return {
      error:
        "Esta conta já tem vendas, comissões ou saques registrados — não pode ser excluída. Bloqueie o acesso em vez disso.",
    };
  }

  await prisma.$transaction([
    // Preserva o histórico de auditoria (ação/metadados); só solta o vínculo
    // com a conta que será excluída.
    prisma.auditLog.updateMany({ where: { actorId: targetId }, data: { actorId: null } }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "USER_DELETED",
        entity: "User",
        entityId: targetId,
        metadata: { email: target.email, role: target.role },
      },
    }),
    prisma.user.delete({ where: { id: targetId } }),
  ]);

  revalidatePath("/admin/usuarios");
  return {};
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireUser(STAFF_ROLES);
  const targetId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;
  if (!targetId || !ALL_ROLES.includes(role)) return;
  if (targetId === admin.id) return; // admin não muda o próprio papel

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
  if (!target) return;

  // Gerente: só pode mexer em vendedor/afiliado e só atribuir esses papéis.
  if (!isFullAccess(admin.role)) {
    if (!SELLER_ROLES.includes(target.role) || !SELLER_ROLES.includes(role)) return;
  }

  // Só pode existir 1 conta de ADMIN e 1 de DESENVOLVEDOR.
  if (await singletonRoleTaken(role, targetId)) return;

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
