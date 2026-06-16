import { prisma, UserStatus, type Role } from "@cleci/db";
import { requireUser } from "@/server/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  approveUserAction,
  blockUserAction,
  unblockUserAction,
  updateUserRoleAction,
} from "./actions";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  VENDEDOR_FIXO: "Vendedor",
  AFILIADO: "Afiliado",
};

const STATUS_STYLE: Record<UserStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  ATIVO: "bg-green-100 text-green-800",
  BLOQUEADO: "bg-red-100 text-red-800",
};

export default async function AdminUsersPage() {
  const admin = await requireUser(["ADMIN"]);

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
          <CardTitle>Contas ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {users.map((u) => (
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
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[u.status]}`}
                  >
                    {u.status}
                  </span>

                  {u.id === admin.id ? (
                    <span className="text-xs text-muted-foreground">(você)</span>
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
                          <option value="ADMIN">Admin</option>
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
                        <form action={blockUserAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <Button size="sm" variant="destructive" type="submit">
                            Bloquear
                          </Button>
                        </form>
                      )}
                      {u.status === UserStatus.BLOQUEADO && (
                        <form action={unblockUserAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <Button size="sm" variant="outline" type="submit">
                            Desbloquear
                          </Button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
