import Link from "next/link";
import type { ClientListRow } from "@/server/services/clients";
import { rotuloStatus } from "@/lib/client-ownership";

const STATUS_STYLE = {
  livre: "bg-muted text-muted-foreground",
  bloqueada: "bg-primary/10 text-primary",
  disponivel: "bg-amber-100 text-amber-800",
} as const;

/** Lista de empresas usada na base geral e no agrupamento por cidade. */
export function ClientList({ clients }: { clients: ClientListRow[] }) {
  return (
    <div className="divide-y divide-border">
      {clients.map((c) => (
        <div
          key={c.id}
          className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <Link href={`/clientes/${c.id}`} className="truncate font-medium hover:underline">
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
                c.cpf,
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
  );
}
