import { requireUser } from "@/server/session";
import { currentPeriod, listVendedorGoals } from "@/server/services/goals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/progress-bar";
import { formatCents } from "@/lib/money";
import { setGoalAction } from "./actions";

export const dynamic = "force-dynamic";

const MES = [
  "",
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default async function AdminMetasPage() {
  await requireUser(["ADMIN"]);

  const period = currentPeriod();
  const rows = await listVendedorGoals(period);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Metas dos vendedores</h1>
        <p className="text-muted-foreground">
          Período: {MES[period.month]} de {period.year}.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Vendedores ({rows.length})</CardTitle>
          <CardDescription>
            Defina a meta do mês. O realizado considera as vendas pagas atribuídas a cada vendedor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum vendedor cadastrado.</p>
          ) : (
            <div className="space-y-5">
              {rows.map((v) => (
                <div key={v.id} className="space-y-2 border-b border-border pb-4 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{v.name ?? v.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCents(v.achievedCents)} de {formatCents(v.targetCents)} · {v.percent}%
                      </p>
                    </div>
                    <form action={setGoalAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={v.id} />
                      <input type="hidden" name="year" value={period.year} />
                      <input type="hidden" name="month" value={period.month} />
                      <Input
                        name="target"
                        defaultValue={v.targetCents ? (v.targetCents / 100).toFixed(2).replace(".", ",") : ""}
                        placeholder="Meta (R$)"
                        className="w-32"
                        inputMode="decimal"
                      />
                      <Button size="sm" variant="outline" type="submit">
                        Salvar
                      </Button>
                    </form>
                  </div>
                  <ProgressBar percent={v.percent} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
