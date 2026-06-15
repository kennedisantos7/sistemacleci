import { prisma } from "@cleci/db";
import { requireUser } from "@/server/session";
import { getConfig } from "@/server/services/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bpsToPercent } from "@/lib/money";
import { ConfigForm } from "./config-form";
import { updateUserRateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminComissoesPage() {
  await requireUser(["ADMIN"]);

  const [config, users] = await Promise.all([
    getConfig(),
    prisma.user.findMany({
      where: { role: { in: ["AFILIADO", "VENDEDOR_FIXO"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, commissionRateBps: true },
    }),
  ]);

  const defaultRatePercent = (config.defaultRateBps / 100).toString();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Comissões</h1>
        <p className="text-muted-foreground">Defina a taxa padrão, o cookie e taxas individuais.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Configuração global</CardTitle>
          <CardDescription>Aplica-se a quem não tem taxa individual definida.</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigForm
            defaultRatePercent={defaultRatePercent}
            cookieDays={config.cookieDurationDays}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxas individuais</CardTitle>
          <CardDescription>
            Deixe em branco para usar a taxa global ({bpsToPercent(config.defaultRateBps)}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {users.map((u) => (
              <form
                key={u.id}
                action={updateUserRateAction}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <input type="hidden" name="userId" value={u.id} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.role === "AFILIADO" ? "Afiliado" : "Vendedor"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Input
                    name="rate"
                    defaultValue={u.commissionRateBps != null ? u.commissionRateBps / 100 : ""}
                    placeholder="global"
                    className="w-28"
                    inputMode="decimal"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Button type="submit" size="sm" variant="outline">
                    Salvar
                  </Button>
                </div>
              </form>
            ))}
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum afiliado/vendedor cadastrado.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
