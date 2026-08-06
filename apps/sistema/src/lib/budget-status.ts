import { BudgetStatus } from "@cleci/db";

/**
 * Rótulos e cores da trilha do orçamento. Fonte única: antes cada tela tinha a
 * própria cópia e elas divergiam com o tempo.
 *
 * Atenção: o valor no banco continua sendo ENVIADO. Só o texto na tela mudou
 * para "Pendente" — é o que a equipe fala no dia a dia (orçamento enviado e
 * aguardando resposta do cliente). Renomear o enum exigiria migração e
 * quebraria os dados já gravados sem ganho nenhum.
 */
export const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Pendente",
  ACEITO: "Aceito",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
};

export const BUDGET_STATUS_STYLE: Record<BudgetStatus, string> = {
  RASCUNHO: "bg-zinc-200 text-zinc-700",
  // Amarelo: está parado esperando o cliente, é o que precisa de acompanhamento.
  ENVIADO: "bg-amber-100 text-amber-800",
  ACEITO: "bg-green-100 text-green-800",
  RECUSADO: "bg-red-100 text-red-800",
  // Laranja para não se confundir com o amarelo de pendente.
  EXPIRADO: "bg-orange-200 text-orange-900",
};

export function isBudgetStatus(v: string): v is BudgetStatus {
  return v in BUDGET_STATUS_LABEL;
}

/** Ordem da trilha, do início ao fim — usada nos filtros e na legenda. */
export const BUDGET_STATUS_ORDER: BudgetStatus[] = [
  BudgetStatus.RASCUNHO,
  BudgetStatus.ENVIADO,
  BudgetStatus.ACEITO,
  BudgetStatus.RECUSADO,
  BudgetStatus.EXPIRADO,
];
