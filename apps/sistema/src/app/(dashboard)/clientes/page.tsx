import Link from "next/link";
import { requireUser } from "@/server/session";
import { listClients } from "@/server/services/clients";
import { BUDGET_ROLES } from "@/lib/rbac";
import { DIAS_ATE_LIBERAR } from "@/lib/client-ownership";
import { ClientList } from "./client-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

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
        <div className="flex flex-wrap gap-2">
          <Link
            href="/clientes/cidades"
            className={buttonVariants({ variant: "outline", className: "w-fit" })}
          >
            Por cidade
          </Link>
          <Link href="/clientes/novo" className={buttonVariants({ className: "w-fit" })}>
            Nova empresa
          </Link>
        </div>
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
            <ClientList clients={clients} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
