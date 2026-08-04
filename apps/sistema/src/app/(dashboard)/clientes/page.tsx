import Link from "next/link";
import { requireUser } from "@/server/session";
import { listClients } from "@/server/services/clients";
import { BUDGET_ROLES } from "@/lib/rbac";
import { rotuloStatus, DIAS_ATE_LIBERAR } from "@/lib/client-ownership";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

const STATUS_STYLE = {
  livre: "bg-muted text-muted-foreground",
  bloqueada: "bg-primary/10 text-primary",
  disponivel: "bg-amber-100 text-amber-800",
} as const;

const FILTROS = [
  { value: "", label: "Toda a base" },
  { value: "minhas", label: "Minhas empresas" },
  { value: "disponiveis", label: "Disponíveis" },
] as const;

function isFiltro(v: string | undefined): v is "minhas" | "disponiveis" {
  return v === "minhas" || v === "disponiveis";
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string }>;
}) {
  const user = await requireUser(BUDGET_ROLES);
  const { q, filtro } = await searchParams;
  const search = q?.trim() || undefined;
  const filtroAtivo = isFiltro(filtro) ? filtro : undefined;

  const clients = await listClients(user, search, filtroAtivo);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes e empresas</h1>
          <p className="text-muted-foreground">
            Base compartilhada por toda a equipe. Quem cadastra tem prioridade de atendimento por{" "}
            {DIAS_ATE_LIBERAR} dias, renovada a cada atividade registrada.
          </p>
        </div>
        <Link href="/clientes/novo" className={buttonVariants({ className: "w-fit" })}>
          Nova empresa
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Resultados ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="q"
              placeholder="Buscar por nome, empresa ou CPF/CNPJ"
              defaultValue={q ?? ""}
              className="sm:max-w-sm"
            />
            <select
              name="filtro"
              defaultValue={filtroAtivo ?? ""}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm sm:w-52"
            >
              {FILTROS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>

          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {search
                ? "Nenhuma empresa encontrada. Antes de cadastrar, confira a grafia — a busca cobre a base inteira."
                : "Nenhuma empresa cadastrada ainda."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="truncate font-medium hover:underline"
                      >
                        {c.companyName ?? c.name}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[c.status.kind]}`}
                      >
                        {c.isMine ? "Sua" : rotuloStatus(c.status)}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {/* Sem contato quando bloqueada com outro vendedor: o corte
                          é feito no servidor, aqui só não há o que mostrar. */}
                      {[
                        c.document,
                        c.local,
                        c.contato?.phone ?? c.contato?.whatsapp,
                        c.contato?.email,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Dados restritos ao vendedor responsável"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.ownerName ? `Responsável: ${c.ownerName}` : "Sem responsável"}
                      {c.status.kind === "bloqueada"
                        ? ` · livre em ${c.status.diasRestantes} dia${c.status.diasRestantes === 1 ? "" : "s"}`
                        : ""}
                      {c.contato ? ` · ${c.budgetCount} orçamento${c.budgetCount === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {c.isMine ? (
                      <Link
                        href={`/orcamentos/novo?cliente=${c.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Novo orçamento
                      </Link>
                    ) : null}
                    <Link
                      href={`/clientes/${c.id}`}
                      className="text-sm font-medium text-foreground/70 hover:text-foreground hover:underline"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
