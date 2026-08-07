import { DesignStatus, BudgetStatus, SaleStatus, type Role } from "@cleci/db";
import { isStaff, isDesigner } from "./rbac";

/**
 * Fluxo da arte. É OPCIONAL e corre em paralelo ao status do orçamento:
 * `designStatus === null` significa que ninguém pediu arte, e o orçamento
 * segue rascunho → pendente → aceito → venda sem nada disso no caminho.
 *
 *   (sem arte) → SOLICITADO → EM_PRODUCAO → ENTREGUE → APROVADA
 *                     ↑                        │
 *                     └───── REVISAO ──────────┘
 *
 * Nenhuma etapa daqui bloqueia a venda: o vendedor pode aceitar e finalizar um
 * orçamento com a arte ainda em produção. Quem decide isso é a negociação, não
 * o sistema.
 */

export const DESIGN_STATUS_LABEL: Record<DesignStatus, string> = {
  SOLICITADO: "Aguardando design",
  EM_PRODUCAO: "Em produção",
  ENTREGUE: "Arte entregue",
  REVISAO: "Em revisão",
  APROVADA: "Arte aprovada",
};

export const DESIGN_STATUS_STYLE: Record<DesignStatus, string> = {
  SOLICITADO: "bg-amber-100 text-amber-800",
  EM_PRODUCAO: "bg-blue-100 text-blue-800",
  ENTREGUE: "bg-violet-100 text-violet-800",
  REVISAO: "bg-orange-200 text-orange-900",
  APROVADA: "bg-green-100 text-green-800",
};

/** Etapas que ainda dão trabalho ao design (a fila dele). */
export const ETAPAS_ABERTAS: DesignStatus[] = [
  DesignStatus.SOLICITADO,
  DesignStatus.EM_PRODUCAO,
  DesignStatus.REVISAO,
];

export type DesignActor = { id: string; role: Role };

export type DesignSubject = {
  vendedorId: string;
  designStatus: DesignStatus | null;
  designerId: string | null;
  /** Situação da venda vinculada, quando existe. */
  saleStatus: SaleStatus | null;
  budgetStatus: BudgetStatus;
  /** Quantas artes já foram anexadas — não dá para entregar sem nenhuma. */
  artCount: number;
};

/** O orçamento é do vendedor (ou quem olha é da equipe administrativa). */
function ehDono(actor: DesignActor, s: DesignSubject): boolean {
  return isStaff(actor.role) || s.vendedorId === actor.id;
}

/**
 * "Antes da aprovação final" = enquanto a venda não estiver finalizada. Depois
 * disso o pedido está fechado e a arte não deve mais mudar.
 */
export function aindaAberto(s: DesignSubject): boolean {
  return s.saleStatus !== SaleStatus.PAGO;
}

// ---------------------------------------------------------------------------
// O que cada um pode fazer
// ---------------------------------------------------------------------------

/** Mandar para o design. Só o dono, e só enquanto não virou venda finalizada. */
export function podeSolicitar(actor: DesignActor, s: DesignSubject): boolean {
  if (!ehDono(actor, s)) return false;
  if (!aindaAberto(s)) return false;
  // Já está com o design ou já foi aprovada: pedir de novo é "pedir revisão".
  return s.designStatus === null;
}

/** Desistir do pedido antes de o designer pegar. */
export function podeCancelar(actor: DesignActor, s: DesignSubject): boolean {
  if (!ehDono(actor, s)) return false;
  return s.designStatus === DesignStatus.SOLICITADO;
}

/** Designer assume o trabalho (sai da fila comum e passa a ser dele). */
export function podeAssumir(actor: DesignActor, s: DesignSubject): boolean {
  if (!isDesigner(actor.role) && !isStaff(actor.role)) return false;
  return s.designStatus === DesignStatus.SOLICITADO || s.designStatus === DesignStatus.REVISAO;
}

/** Anexar arte: só quem está com o trabalho na mão. */
export function podeAnexarArte(actor: DesignActor, s: DesignSubject): boolean {
  if (!isDesigner(actor.role) && !isStaff(actor.role)) return false;
  return (
    s.designStatus === DesignStatus.EM_PRODUCAO ||
    s.designStatus === DesignStatus.SOLICITADO ||
    s.designStatus === DesignStatus.REVISAO
  );
}

/** Devolver ao vendedor. Exige pelo menos uma arte anexada. */
export function podeEntregar(actor: DesignActor, s: DesignSubject): boolean {
  if (!podeAnexarArte(actor, s)) return false;
  return s.artCount > 0;
}

/** Vendedor pede ajuste: volta para a fila do design. */
export function podePedirRevisao(actor: DesignActor, s: DesignSubject): boolean {
  if (!ehDono(actor, s)) return false;
  if (!aindaAberto(s)) return false;
  return s.designStatus === DesignStatus.ENTREGUE || s.designStatus === DesignStatus.APROVADA;
}

/** Vendedor registra o aceite do cliente sobre a arte. */
export function podeAprovarArte(actor: DesignActor, s: DesignSubject): boolean {
  if (!ehDono(actor, s)) return false;
  return s.designStatus === DesignStatus.ENTREGUE;
}

/**
 * Quem pode ver a arte e o andamento: o dono, a equipe administrativa e o
 * designer — este último só depois de o orçamento ter entrado no fluxo.
 */
export function podeVerDesign(actor: DesignActor, s: DesignSubject): boolean {
  if (ehDono(actor, s)) return true;
  if (isDesigner(actor.role)) return s.designStatus !== null;
  return false;
}

/** Frase curta do estado, para o vendedor entender sem abrir nada. */
export function resumoParaVendedor(s: DesignSubject): string | null {
  if (s.designStatus === null) return null;
  switch (s.designStatus) {
    case DesignStatus.SOLICITADO:
      return "Na fila do design, ainda não assumido.";
    case DesignStatus.EM_PRODUCAO:
      return "O design está produzindo a arte.";
    case DesignStatus.ENTREGUE:
      return "Arte pronta — confira e leve para o cliente aprovar.";
    case DesignStatus.REVISAO:
      return "Ajuste solicitado, de volta com o design.";
    case DesignStatus.APROVADA:
      return "Arte aprovada pelo cliente.";
  }
}
