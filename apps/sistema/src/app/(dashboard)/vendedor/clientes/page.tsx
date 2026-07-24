import Link from "next/link";
import { requireUser } from "@/server/session";
import { listClients } from "@/server/services/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function VendedorClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const { q } = await searchParams;
  const search = q?.trim() || undefined;

  const clients = await listClients(user.id, search);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus clientes</h1>
          <p className="text-muted-foreground">
            Cadastre e acompanhe os clientes e empresas da sua carteira.
          </p>
        </div>
        <Link href="/vendedor/clientes/novo" className={buttonVariants({ className: "w-fit" })}>
          Novo cliente
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Clientes ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="flex max-w-md gap-2">
            <Input name="q" placeholder="Buscar por nome, empresa ou CPF/CNPJ" defaultValue={q ?? ""} />
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>

          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhum cliente encontrado para esta busca." : "Você ainda não cadastrou clientes."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {c.name}
                      {c.companyName ? (
                        <span className="text-muted-foreground"> · {c.companyName}</span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.phone, c.email, c.document].filter(Boolean).join(" · ") || "—"} ·{" "}
                      {c._count.budgets} orçamento{c._count.budgets === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/vendedor/orcamentos/novo?cliente=${c.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Novo orçamento
                    </Link>
                    <Link
                      href={`/vendedor/clientes/${c.id}/editar`}
                      className="text-sm font-medium text-foreground/70 hover:text-foreground hover:underline"
                    >
                      Editar
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
