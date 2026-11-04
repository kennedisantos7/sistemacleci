import Link from "next/link";
import { MapPin } from "lucide-react";
import { requireUser } from "@/server/session";
import { listClientCities, listClientsByCity } from "@/server/services/clients";
import { cityKey } from "@/lib/city-key";
import { BUDGET_ROLES } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientList } from "../client-list";

export const dynamic = "force-dynamic";

/** Valor de ?cidade= para o grupo de clientes sem cidade cadastrada. */
const SEM_CIDADE = "__sem-cidade__";

function hrefCidade(key: string) {
  return `/clientes/cidades?cidade=${encodeURIComponent(key || SEM_CIDADE)}`;
}

/**
 * Clientes por cidade — visão geral da base, de todos os vendedores.
 * Digitar o nome exato da cidade (ex.: "Palmas") abre direto os clientes dela;
 * um trecho ("ara") filtra a lista de cidades.
 */
export default async function ClientesPorCidadePage({
  searchParams,
}: {
  searchParams: Promise<{ cidade?: string }>;
}) {
  const user = await requireUser(BUDGET_ROLES);
  const { cidade } = await searchParams;
  const termo = cidade?.trim() ?? "";

  const cities = await listClientCities();
  const total = cities.reduce((s, c) => s + c.count, 0);

  const chave = termo === SEM_CIDADE ? "" : cityKey(termo);
  const selecionada = termo ? cities.find((c) => c.key === chave) : undefined;

  // ---------- Uma cidade aberta: lista todos os clientes dela ----------
  if (selecionada) {
    const clients = await listClientsByCity(user, selecionada);
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <Link
            href="/clientes/cidades"
            className="text-sm font-medium text-foreground/70 hover:text-foreground hover:underline"
          >
            ← Todas as cidades
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MapPin className="h-6 w-6 text-primary" />
            {selecionada.label}
            {selecionada.state ? (
              <span className="text-muted-foreground">/{selecionada.state}</span>
            ) : null}
          </h1>
          <p className="text-muted-foreground">
            {clients.length} cliente{clients.length === 1 ? "" : "s"} cadastrado
            {clients.length === 1 ? "" : "s"} por toda a equipe.
          </p>
        </header>

        <Card>
          <CardContent className="pt-6">
            <ClientList clients={clients} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- Visão geral: cidades com a contagem de clientes ----------
  const busca = cityKey(termo);
  const filtradas = busca ? cities.filter((c) => c.key.includes(busca)) : cities;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes por cidade</h1>
          <p className="text-muted-foreground">
            Base geral de todos os vendedores: {total} cliente{total === 1 ? "" : "s"} em{" "}
            {cities.filter((c) => c.key).length} cidade
            {cities.filter((c) => c.key).length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link href="/clientes" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Voltar para Clientes
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Cidades ({filtradas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="cidade"
              placeholder="Digite a cidade (ex.: Palmas)"
              defaultValue={termo}
              className="sm:max-w-sm"
              autoFocus
            />
            <Button type="submit" variant="outline">
              Buscar
            </Button>
            {termo ? (
              <Link
                href="/clientes/cidades"
                className={buttonVariants({ variant: "ghost", className: "w-fit" })}
              >
                Limpar
              </Link>
            ) : null}
          </form>

          {filtradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {termo
                ? `Nenhuma cidade encontrada para "${termo}".`
                : "Nenhum cliente cadastrado ainda."}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtradas.map((c) => (
                <Link
                  key={c.key || SEM_CIDADE}
                  href={hrefCidade(c.key)}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPin
                      className={`h-4 w-4 shrink-0 ${c.key ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className={`truncate font-medium ${c.key ? "" : "text-muted-foreground"}`}>
                      {c.label}
                      {c.state ? <span className="text-muted-foreground">/{c.state}</span> : null}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                    {c.count}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
