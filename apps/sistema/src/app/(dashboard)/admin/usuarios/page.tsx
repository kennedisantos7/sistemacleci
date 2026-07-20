import { prisma, UserStatus, type Role } from "@cleci/db";
import { requireUser } from "@/server/session";
import { STAFF_ROLES, SELLER_ROLES, isFullAccess } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateUserForm } from "./create-user-form";
import { ResetPasswordForm } from "./reset-password-form";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import { approveUserAction, blockUserAction, unblockUserAction, updateUserRoleAction } from "./actions";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  DESENVOLVEDOR: "Desenvolvedor",
  GERENTE: "Gerente",
  VENDEDOR_FIXO: "Vendedor",
  AFILIADO: "Afiliado",
};

const STATUS_STYLE: Record<UserStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  ATIVO: "bg-green-100 text-green-800",
  BLOQUEADO: "bg-red-100 text-red-800",
};

export default async function AdminUsersPage() {
  const admin = await requireUser(STAFF_ROLES);
  const canManageStaff = isFullAccess(admin.role);

  const users = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      commissionRateBps: true,
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Aprove cadastros e gerencie o acesso das contas.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Criar login</CardTitle>
          <CardDescription>
            {canManageStaff
              ? "Crie contas da equipe (admin, desenvolvedor, gerente) ou de vendedor/afiliado. Já entram ativas — o cadastro público é apenas para afiliados."
              : "Crie contas de vendedor ou afiliado. Já entram ativas — o cadastro público é apenas para afiliados."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm canManageStaff={canManageStaff} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contas ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {users.map((u) => {
              const targetIsStaff = !SELLER_ROLES.includes(u.role);
              // Gerente não gerencia contas da equipe.
              const canManage = canManageStaff || !targetIsStaff;

              return (
                <div
                  key={u.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.name ?? u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email} · {ROLE_LABEL[u.role]}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[u.status]}`}
                    >
                      {u.status}
                    </span>

                    {u.id === admin.id ? (
                      <span className="text-xs text-muted-foreground">(você)</span>
                    ) : !canManage ? (
                      <span className="text-xs text-muted-foreground">(equipe)</span>
                    ) : (
                      <>
                        <form action={updateUserRoleAction} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={u.id} />
                          <select
                            name="role"
                            defaultValue={u.role}
                            className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                          >
                            <option value="AFILIADO">Afiliado</option>
                            <option value="VENDEDOR_FIXO">Vendedor</option>
                            {canManageStaff && (
                              <>
                                <option value="GERENTE">Gerente</option>
                                <option value="DESENVOLVEDOR">Desenvolvedor</option>
                                <option value="ADMIN">Admin</option>
                              </>
                            )}
                          </select>
                          <Button size="sm" variant="outline" type="submit">
                            Papel
                          </Button>
                        </form>
                        {u.status === UserStatus.PENDENTE && (
                          <form action={approveUserAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <Button size="sm" type="submit">
                              Aprovar
                            </Button>
                          </form>
                        )}
                        {u.status === UserStatus.ATIVO && (
                          <ConfirmSubmitButton
                            action={blockUserAction}
                            hidden={{ userId: u.id }}
                            label="Bloquear"
                            pendingLabel="Bloqueando..."
                            variant="destructive"
                            confirmMessage={`Bloquear o acesso de ${u.name ?? u.email}? A conta não conseguirá mais entrar no painel.`}
                          />
                        )}
                        {u.status === UserStatus.BLOQUEADO && (
                          <form action={unblockUserAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <Button size="sm" variant="outline" type="submit">
                              Desbloquear
                            </Button>
                          </form>
                        )}
                        <ResetPasswordForm userId={u.id} userLabel={u.name ?? u.email} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
