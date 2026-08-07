import { BudgetDocType } from "@cleci/db";

/**
 * Orçamento e pedido são documentos diferentes, não um campo cosmético:
 *
 * - ORÇAMENTO: peça comercial. PDF enxuto, focado no valor do serviço, sem
 *   dados da empresa, cláusulas ou assinatura.
 * - PEDIDO: documento que fecha a venda. PDF completo, com a empresa inteira,
 *   as cláusulas e as duas assinaturas.
 *
 * A conversão é de MÃO ÚNICA. Um pedido já foi entregue ao cliente como
 * documento de fechamento; rebaixá-lo para orçamento reescreveria o que ele
 * recebeu e assinou.
 */

export const DOC_TYPE_LABEL: Record<BudgetDocType, string> = {
  ORCAMENTO: "Orçamento",
  PEDIDO: "Pedido",
};

/** Cada documento tem sua seção no menu — listas, criação e detalhe separados. */
export const DOC_TYPE_BASE: Record<BudgetDocType, string> = {
  ORCAMENTO: "/orcamentos",
  PEDIDO: "/pedidos",
};

/** Monta a rota de um documento dentro da seção dele: docPath(PEDIDO, id) -> /pedidos/<id> */
export function docPath(docType: BudgetDocType, ...segmentos: string[]): string {
  const base = DOC_TYPE_BASE[docType];
  return segmentos.length === 0 ? base : `${base}/${segmentos.join("/")}`;
}

/** O tipo que deve ser gravado, dado o que está no banco e o que veio da tela. */
export function resolverDocType(
  atual: BudgetDocType | null,
  solicitado: BudgetDocType,
): BudgetDocType {
  // Já é pedido: nada rebaixa. Vale para o formulário e para requisição forjada.
  if (atual === BudgetDocType.PEDIDO) return BudgetDocType.PEDIDO;
  return solicitado;
}

/** Pode virar pedido (ou seja: ainda é orçamento). */
export function podeConverterEmPedido(atual: BudgetDocType): boolean {
  return atual === BudgetDocType.ORCAMENTO;
}
