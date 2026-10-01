import Link from "next/link";
import { ImageOff } from "lucide-react";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import {
  casarFotosPorCodigo,
  inventarioDeMidia,
  organizacaoPorCategoria,
  type ItemDaTabela,
  type ProdutoDaVitrine,
} from "@/server/services/media-import";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { miniatura } from "@/lib/media-url";
import { Migracao } from "./migracao";

export const dynamic = "force-dynamic";

function megabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

/**
 * Fotos e vídeos do catálogo, guardados no banco. Aqui ficam a migração dos
 * links antigos e a visão por categoria → produto, para achar o que falta.
 * Adicionar foto continua sendo na ficha de cada produto.
 */
export default async function ImagensPage() {
  await requireUser(FULL_ACCESS_ROLES);

  const [inv, previa, org] = await Promise.all([
    inventarioDeMidia(),
    casarFotosPorCodigo(false),
    organizacaoPorCategoria(),
  ]);

  const comFoto = inv.itensTabela - inv.itensSemFoto;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Imagens</h1>
        <p className="text-muted-foreground">
          Fotos e vídeos do site e da ficha de pedido, guardados no banco da Cleci. Para adicionar
          ou trocar, abra o produto.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Arquivos no banco"
          value={String(inv.arquivosNoBanco)}
          hint={megabytes(inv.bytesNoBanco)}
        />
        <StatCard
          title="Ainda em link externo"
          value={String(inv.linksExternos)}
          hint={inv.linksExternos === 0 ? "Tudo no banco" : "imgur ou outro site"}
        />
        <StatCard
          title="Ficha de pedido com foto"
          value={`${comFoto} de ${inv.itensTabela}`}
          hint="Itens da tabela de preços"
        />
        <StatCard
          title="Sem foto"
          value={String(inv.itensSemFoto)}
          hint={`${previa.casados.length} dá${previa.casados.length === 1 ? "" : "o"} para preencher pelo código`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trazer para o banco</CardTitle>
          <CardDescription>
            Baixa as fotos que ainda são links externos, guarda no banco e troca o endereço em todo
            o cadastro. O link antigo fica registrado. Depois, preenche a foto da ficha de pedido dos
            itens cujo código aparece numa linha ou produto do site — quem não tiver
            correspondência fica sem foto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Migracao linksExternos={inv.linksExternos} casaveis={previa.casados.length} />
        </CardContent>
      </Card>

      {org.categorias.map((c) => (
        <Categoria key={c.id} nome={c.name} produtos={c.produtos} itens={c.itens} />
      ))}
      {org.semCategoria.length > 0 ? (
        <Categoria nome="Sem categoria" produtos={[]} itens={org.semCategoria} />
      ) : null}
    </div>
  );
}

function Categoria({
  nome,
  produtos,
  itens,
}: {
  nome: string;
  produtos: ProdutoDaVitrine[];
  itens: ItemDaTabela[];
}) {
  const semFoto = itens.filter((i) => !i.imageUrl).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{nome}</CardTitle>
        <CardDescription>
          {produtos.length} produto{produtos.length === 1 ? "" : "s"} no site · {itens.length - semFoto} de{" "}
          {itens.length} ite{itens.length === 1 ? "m" : "ns"} da tabela com foto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {produtos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {produtos.map((p) => (
              <Link
                key={p.id}
                href={`/admin/produtos/site/${p.id}/editar`}
                className="group overflow-hidden rounded-md border border-border transition-colors hover:border-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={miniatura(p.capa, 320)}
                  alt={p.title}
                  loading="lazy"
                  className="aspect-square w-full bg-muted object-cover"
                />
                <div className="space-y-0.5 p-2">
                  <p className="line-clamp-2 text-xs font-medium group-hover:text-primary">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.fotos} foto{p.fotos === 1 ? "" : "s"}
                    {p.linhas > 0 ? ` · ${p.linhas} linha${p.linhas === 1 ? "" : "s"}` : ""}
                  </p>
                  {p.externas > 0 ? (
                    <p className="text-[11px] font-medium text-amber-700">
                      {p.externas} ainda em link externo
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {itens.length > 0 ? (
          <details className="rounded-md border border-border" open={produtos.length === 0}>
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
              Itens da tabela de preços ({itens.length})
              {semFoto > 0 ? (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {semFoto} sem foto
                </span>
              ) : null}
            </summary>
            <ul className="divide-y divide-border border-t border-border">
              {itens.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-3 py-2">
                  {i.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={miniatura(i.imageUrl, 96)}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded border border-border object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-dashed border-border text-muted-foreground">
                      <ImageOff className="h-4 w-4" aria-label="sem foto" />
                    </span>
                  )}
                  <span className="w-14 shrink-0 font-mono text-xs">{i.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{i.description}</span>
                  <Link
                    href={`/admin/produtos/${i.id}/editar`}
                    className="shrink-0 text-xs font-medium text-primary hover:underline"
                  >
                    {i.imageUrl ? "Trocar" : "Adicionar foto"}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
