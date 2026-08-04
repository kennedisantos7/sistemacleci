import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientActivityType, BudgetStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { BUDGET_ROLES, isStaff } from "@/lib/rbac";
import { getClientProfile, listTransferTargets } from "@/server/services/clients";
import { rotuloStatus, DIAS_ATE_LIBERAR } from "@/lib/client-ownership";
import { formatCents } from "@/lib/money";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ActivityForm } from "../activity-form";
import {
  ClaimClientButton,
  ReleaseClientButton,
  TransferClientForm,
} from "../ownership-actions";

export const dynamic = "force-dynamic";

const STATUS_STYLE = {
  livre: "bg-muted text-muted-foreground",
  bloqueada: "bg-primary/10 text-primary",
  disponivel: "bg-amber-100 text-amber-800",
} as const;

const ATIVIDADE_LABEL: Record<ClientActivityType, string> = {
  LIGACAO: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  REUNIAO: "Reunião",
  VISITA: "Visita",
  PROPOSTA: "Proposta enviada",
  OBSERVACAO: "Observação",
  SISTEMA: "Sistema",
};

const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  ACEITO: "Aceito",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
};

function Campo({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function ClientePerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(BUDGET_ROLES);
  const { id } = await params;

  const client = await getClientProfile(user, id);
  if (!client) notFound();

  const staff = isStaff(user.role);
  const vendedores = staff ? await listTransferTargets() : [];
  const titulo = client.companyName ?? client.name;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/clientes" className="text-sm text-muted-foreground hover:underline">
            ← Clientes
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold">
            {titulo}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[client.status.kind]}`}
            >
              {rotuloStatus(client.status)}
            </span>
          </h1>
          {client.companyName ? (
            <p className="text-muted-foreground">Contato: {client.name}</p>
          ) : null}
        </div>

        {client.editavel ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/orcamentos/novo?cliente=${client.id}`}
              className={buttonVariants({ size: "sm" })}
            >
              Novo orçamento
            </Link>
            <Link
              href={`/clientes/${client.id}/editar`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Editar ficha
            </Link>
          </div>
        ) : null}
      </header>

      {/* Titularidade — quem atende, até quando, e o que dá para fazer. */}
      <Card>
        <CardHeader>
          <CardTitle>Atendimento</CardTitle>
          <CardDescription>
            {client.status.kind === "bloqueada" ? (
              <>
                Em atendimento por <strong>{client.ownerName}</strong> — prioridade até{" "}
                {client.status.expiraEm.toLocaleDateString("pt-BR")} (
                {client.status.diasRestantes} dia
                {client.status.diasRestantes === 1 ? "" : "s"}).
              </>
            ) : client.status.kind === "disponivel" ? (
              <>
                Último titular: <strong>{client.ownerName}</strong>, sem atividade há mais de{" "}
                {DIAS_ATE_LIBERAR} dias. Qualquer vendedor pode assumir.
              </>
            ) : (
              <>Esta empresa não tem vendedor responsável. Qualquer vendedor pode assumir.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-3">
            <Campo label="Responsável" value={client.ownerName} />
            <Campo
              label="Titular desde"
              value={client.ownerSince?.toLocaleDateString("pt-BR") ?? null}
            />
            <Campo
              label="Última atividade"
              value={client.lastActivityAt?.toLocaleDateString("pt-BR") ?? null}
            />
          </dl>

          <div className="flex flex-wrap items-end gap-3">
            {client.status.kind !== "bloqueada" && !client.isMine ? (
              <ClaimClientButton clientId={client.id} label="o atendimento" />
            ) : null}
            {client.isMine ? <ReleaseClientButton clientId={client.id} /> : null}
          </div>

          {staff ? (
            <div className="border-t border-border pt-4">
              <TransferClientForm
                clientId={client.id}
                ownerId={client.ownerId}
                vendedores={vendedores}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Empresa bloqueada com outro vendedor: identificação e nada mais. */}
      {!client.liberado ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Os dados de contato, os orçamentos e o histórico desta empresa ficam visíveis apenas
              para <strong>{client.ownerName}</strong> enquanto durar a prioridade de atendimento.
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <Campo label="Razão social / nome" value={client.name} />
              <Campo label="CPF/CNPJ" value={client.document} />
              <Campo label="Cidade" value={client.local} />
            </dl>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Dados da empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Campo label="Razão social / nome" value={client.name} />
                <Campo label="Nome fantasia" value={client.companyName} />
                <Campo label="CPF/CNPJ" value={client.document} />
                <Campo label="Contato" value={client.ficha?.contactName ?? null} />
                <Campo label="Telefone" value={client.ficha?.phone ?? null} />
                <Campo label="WhatsApp" value={client.ficha?.whatsapp ?? null} />
                <Campo label="E-mail" value={client.ficha?.email ?? null} />
                <Campo label="Endereço" value={client.ficha?.address ?? null} />
                <Campo label="CEP" value={client.ficha?.zip ?? null} />
                <Campo label="Cidade/UF" value={client.local} />
              </dl>
              {client.ficha?.note ? (
                <div className="mt-4 rounded-md bg-muted p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Observações
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{client.ficha.note}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orçamentos e pedidos ({client.budgets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {client.budgets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum orçamento registrado para esta empresa ainda.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {client.budgets.map((b) => (
                    <Link
                      key={b.id}
                      href={`/orcamentos/${b.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {b.docType === "PEDIDO" ? "Pedido" : "Orçamento"} #{b.number}
                          {b.title ? ` — ${b.title}` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {b.createdAt.toLocaleDateString("pt-BR")} ·{" "}
                          {BUDGET_STATUS_LABEL[b.status]}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatCents(b.totalCents)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de contatos</CardTitle>
              <CardDescription>
                Tudo o que já foi feito com esta empresa, do mais recente ao mais antigo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {client.podeRegistrar ? (
                <ActivityForm clientId={client.id} assumeAoRegistrar={client.registrarAssume} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Esta empresa está em atendimento por {client.ownerName}. Só o responsável
                  registra contatos enquanto durar a prioridade.
                </p>
              )}

              {client.activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
              ) : (
                <ol className="space-y-3 border-l border-border pl-4">
                  {client.activities.map((a) => (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-sm">
                        <span className="font-medium">{ATIVIDADE_LABEL[a.type]}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {a.createdAt.toLocaleDateString("pt-BR")}{" "}
                          {a.createdAt.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {a.authorName ? ` · ${a.authorName}` : ""}
                        </span>
                      </p>
                      {a.note ? (
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {a.note}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
