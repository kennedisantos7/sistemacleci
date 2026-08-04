import { CIDADES_TOCANTINS } from "./cidades-tocantins";

/**
 * Opções fixas do cabeçalho do orçamento. Usadas pelo formulário (para montar
 * os campos) e pelo servidor (para validar) — uma fonte só, sem divergir.
 */

/** Formas de pagamento aceitas. */
export const FORMAS_PAGAMENTO = ["PIX", "CRÉDITO", "BOLETO"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

/** Prazos de entrega oferecidos, de 7 a 30 dias. */
export const DIAS_ENTREGA = Array.from({ length: 24 }, (_, i) => i + 7);

/** Rótulo exibido e gravado, ex.: "15 dias". */
export function rotuloPrazo(dias: number): string {
  return `${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export const PRAZOS_ENTREGA = DIAS_ENTREGA.map(rotuloPrazo);

export { CIDADES_TOCANTINS };

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------
// Regra comum: valor vazio é sempre aceito (os três campos são opcionais).
//
// Para valores já gravados que não estão nas listas — orçamentos criados
// quando estes campos eram texto livre — quem chama passa `atual`, e o valor
// é preservado. Sem isso, editar um orçamento antigo apagaria silenciosamente
// o que estava lá.

function validarComLista(
  valor: string,
  lista: readonly string[],
  atual?: string | null,
): string | null {
  const limpo = valor.trim();
  if (!limpo) return null;
  if (lista.includes(limpo)) return limpo;
  if (atual && limpo === atual.trim()) return limpo; // legado preservado
  return null;
}

export function validarFormaPagamento(valor: string, atual?: string | null): string | null {
  return validarComLista(valor, FORMAS_PAGAMENTO, atual);
}

export function validarPrazoEntrega(valor: string, atual?: string | null): string | null {
  return validarComLista(valor, PRAZOS_ENTREGA, atual);
}

/**
 * Cidade aceita qualquer texto, não só a lista do Tocantins: a Cleci entrega
 * fora do estado, e travar no TO impediria de fechar essas vendas. A lista
 * serve como sugestão (datalist), cobrindo o caso comum sem bloquear o resto.
 */
export function validarCidadeEntrega(valor: string): string | null {
  const limpo = valor.trim();
  if (!limpo) return null;
  return limpo.slice(0, 120);
}
