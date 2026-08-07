import Link from "next/link";
import { requireUser } from "@/server/session";
import { DESIGN_ROLES } from "@/lib/rbac";
import { listDesignQueue, countDesignQueue } from "@/server/services/design";
import { DESIGN_STATUS_LABEL, DESIGN_STATUS_STYLE } from "@/lib/design-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const FILTROS = [
  { value: "abertos", label: "Na fila" },
  { value: "meus", label: "Comigo" },
  { value: "entregues", label: "Entregues" },
  { value: "todos", label: "Todos" },
] as const;

type Filtro = (typeof FILTROS)[number]["value"];

function isFiltro(v: string | undefined): v is Filtro {
  return FILTROS.some((f) => f.value === v);
}

export default async function DesignPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const user = await requireUser(DESIGN_ROLES);
  const { filtro } = await searchParams;
  const ativo: Filtro = isFiltro(filtro) ? filtro : "abertos";

  const [itens, contagem] = await Promise.all([
    listDesignQueue(user, ativo),
    countDesignQueue(user),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Fila de arte</h1>
        <p className="text-muted-foreground">
          Pedidos que os vendedores enviaram para o design. {contagem.abertos} aberto
          {contagem.abertos === 1 ? "" : "s"}, {contagem.meus} com você.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.value}
            href={`/design?filtro=${f.value}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              f.value === ativo
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {FILTROS.find((f) => f.value === ativo)!.label} ({itens.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {ativo === "abertos"
                ? "Nada na fila agora. Quando um vendedor enviar um pedido, ele aparece aqui."
                : "Nenhum pedido nesta situação."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {itens.map((b) => (
                <Link
                  key={b.id}
                  href={`/orcamentos/${b.id}`}
                  className="flex flex-col gap-1 py-3 transition-colors hover:bg-muted/40 sm:px-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 font-medium">
                      {b.docType === "PEDIDO" ? "Pedido" : "Orçamento"} #{b.number} ·{" "}
                      {b.client.companyName ?? b.client.name}
                      {b.title ? (
                        <span className="text-muted-foreground"> — {b.title}</span>
                      ) : null}
                    </span>
                    {b.designStatus ? (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${DESIGN_STATUS_STYLE[b.designStatus]}`}
                      >
                        {DESIGN_STATUS_LABEL[b.designStatus]}
                      </span>
                    ) : null}
                  </div>

                  {b.designBrief ? (
                    <p className="line-clamp-2 text-sm text-foreground/80">{b.designBrief}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      O vendedor não deixou briefing.
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {b._count.items} ite{b._count.items === 1 ? "m" : "ns"} ·{" "}
                    {b._count.arts} arte{b._count.arts === 1 ? "" : "s"} anexada
                    {b._count.arts === 1 ? "" : "s"} · pedido por{" "}
                    {b.vendedor.name ?? b.vendedor.email}
                    {b.designRequestedAt
                      ? ` em ${b.designRequestedAt.toLocaleDateString("pt-BR")}`
                      : ""}
                    {b.designer ? ` · com ${b.designer.name ?? b.designer.email}` : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
