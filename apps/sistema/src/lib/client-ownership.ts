import type { Role } from "@cleci/db";
import { isStaff } from "./rbac";

/**
 * Regra de titularidade da carteira de clientes.
 *
 * A base de empresas é compartilhada: qualquer vendedor pesquisa qualquer
 * empresa. Mas quem cadastrou tem prioridade de atendimento — enquanto estiver
 * trabalhando o cliente, ninguém mais pega. "Trabalhando" = alguma atividade
 * registrada nos últimos 30 dias (contato lançado, orçamento, edição da ficha).
 *
 * Passado o prazo sem sinal de vida, a empresa fica DISPONÍVEL: continua com o
 * titular antigo até que outro vendedor a assuma de fato. Não há liberação
 * automática — a troca só acontece por ação de alguém, o que deixa rastro no
 * histórico e evita o cliente trocar de dono sozinho durante umas férias.
 */

/** Dias sem atividade até a empresa ficar disponível para outro vendedor. */
export const DIAS_ATE_LIBERAR = 30;

const MS_POR_DIA = 86_400_000;

export type OwnershipInput = {
  vendedorId: string | null;
  lastActivityAt: Date | null;
};

export type OwnershipActor = { id: string; role: Role };

export type OwnershipStatus =
  /** Sem titular — qualquer vendedor pode pegar. */
  | { kind: "livre"; expiraEm: null; diasRestantes: 0 }
  /** Titular ativo — bloqueada para os demais. */
  | { kind: "bloqueada"; expiraEm: Date; diasRestantes: number }
  /** Titular parado além do prazo — outro vendedor pode assumir. */
  | { kind: "disponivel"; expiraEm: Date; diasRestantes: 0 };

/** Quando a titularidade vence, dado o último sinal de atividade. */
export function vencimentoTitularidade(lastActivityAt: Date): Date {
  return new Date(lastActivityAt.getTime() + DIAS_ATE_LIBERAR * MS_POR_DIA);
}

/** Dias inteiros que faltam para vencer (0 se já venceu). */
export function diasRestantes(expiraEm: Date, agora: Date): number {
  const restante = expiraEm.getTime() - agora.getTime();
  return restante <= 0 ? 0 : Math.ceil(restante / MS_POR_DIA);
}

export function statusTitularidade(client: OwnershipInput, agora: Date): OwnershipStatus {
  if (!client.vendedorId) return { kind: "livre", expiraEm: null, diasRestantes: 0 };

  // Titular sem data de atividade (registro anterior à regra que escapou do
  // backfill): trata como disponível em vez de bloquear para sempre.
  if (!client.lastActivityAt) {
    const jaVencido = new Date(0);
    return { kind: "disponivel", expiraEm: jaVencido, diasRestantes: 0 };
  }

  const expiraEm = vencimentoTitularidade(client.lastActivityAt);
  const restantes = diasRestantes(expiraEm, agora);
  return restantes > 0
    ? { kind: "bloqueada", expiraEm, diasRestantes: restantes }
    : { kind: "disponivel", expiraEm, diasRestantes: 0 };
}

/** É o titular atual da empresa. */
export function ehTitular(actor: OwnershipActor, client: OwnershipInput): boolean {
  return client.vendedorId !== null && client.vendedorId === actor.id;
}

/**
 * Pode ver os dados de contato e o histórico. Titular e equipe administrativa
 * sempre podem; os demais só quando a empresa não está bloqueada — senão o
 * bloqueio não seguraria nada, bastaria copiar o telefone e ligar.
 */
export function podeVerDetalhes(
  actor: OwnershipActor,
  client: OwnershipInput,
  agora: Date,
): boolean {
  if (isStaff(actor.role)) return true;
  if (ehTitular(actor, client)) return true;
  return statusTitularidade(client, agora).kind !== "bloqueada";
}

/** Pode editar a ficha e lançar atividades: titular ou equipe administrativa. */
export function podeEditar(actor: OwnershipActor, client: OwnershipInput): boolean {
  return isStaff(actor.role) || ehTitular(actor, client);
}

/** Pode assumir a empresa: não é o titular e ela não está bloqueada. */
export function podeAssumir(
  actor: OwnershipActor,
  client: OwnershipInput,
  agora: Date,
): boolean {
  if (ehTitular(actor, client)) return false;
  return statusTitularidade(client, agora).kind !== "bloqueada";
}

/** Pode usar a empresa em um orçamento — mesma régua da edição. */
export function podeOrcar(actor: OwnershipActor, client: OwnershipInput): boolean {
  return podeEditar(actor, client);
}

const ROTULO: Record<OwnershipStatus["kind"], string> = {
  livre: "Sem vendedor",
  bloqueada: "Em atendimento",
  disponivel: "Disponível",
};

export function rotuloStatus(status: OwnershipStatus): string {
  return ROTULO[status.kind];
}
