/**
 * Motor de cálculo do orçamento/pedido — espelha a planilha.
 *
 *   M2            = Largura × Comprimento
 *   Valor Parcial = unidade M2 ? Valor × M2 : Valor
 *   TOTAL (linha) = Valor Parcial × Qtd
 *   TOTAL PEDIDO  = Σ TOTAL das linhas
 *   TOTAL FINAL   = TOTAL PEDIDO − Desconto + Adicional + Frete + Imposto
 *
 * Funções puras, sem dependência de Prisma nem de React: rodam no servidor
 * (fonte da verdade) e no cliente (prévia ao vivo) com o mesmo resultado.
 * Dinheiro sempre em CENTAVOS inteiros — nunca somamos floats.
 */

export type BudgetUnit = "M2" | "UNIDADE" | "PACOTE" | "MILHEIRO";
export type AdjustmentKind = "VALOR" | "PERCENTUAL";

/** Um ajuste do rodapé: R$ (input em centavos) ou % (input em bps). */
export type Adjustment = { mode: AdjustmentKind; input: number };

export const ZERO_ADJUSTMENT: Adjustment = { mode: "VALOR", input: 0 };

export type BudgetItemCalcInput = {
  unit: BudgetUnit;
  unitPriceCents: number;
  quantity: number;
  /** Só usados quando unit === "M2". */
  widthM?: number | null;
  lengthM?: number | null;
};

export type BudgetItemCalcResult = {
  /** null quando a unidade não é M2. */
  areaM2: number | null;
  partialCents: number;
  totalCents: number;
};

export type BudgetAdjustments = {
  discount: Adjustment;
  surcharge: Adjustment;
  freight: Adjustment;
  tax: Adjustment;
};

export type BudgetTotals = {
  subtotalCents: number;
  discountCents: number;
  surchargeCents: number;
  freightCents: number;
  taxCents: number;
  totalCents: number;
};

/** Área em m² com 4 casas — a planilha multiplica largura × comprimento. */
export function calcAreaM2(widthM: number, lengthM: number): number {
  return Math.round(widthM * lengthM * 10_000) / 10_000;
}

/** Cálculo de uma linha de item. */
export function calcItem(item: BudgetItemCalcInput): BudgetItemCalcResult {
  const isM2 = item.unit === "M2";
  const areaM2 = isM2 ? calcAreaM2(item.widthM ?? 0, item.lengthM ?? 0) : null;

  // Fora do m², o valor parcial é o próprio preço unitário (Unidade/Pacote/Milheiro).
  const partialCents = isM2
    ? Math.round(item.unitPriceCents * (areaM2 ?? 0))
    : item.unitPriceCents;

  return {
    areaM2,
    partialCents,
    totalCents: Math.round(partialCents * item.quantity),
  };
}

/** Resolve um ajuste em centavos. Percentual incide sobre o subtotal. */
export function resolveAdjustment(adjustment: Adjustment, subtotalCents: number): number {
  if (adjustment.mode === "PERCENTUAL") {
    // bps: 1500 = 15%.
    return Math.round((subtotalCents * adjustment.input) / 10_000);
  }
  return Math.round(adjustment.input);
}

/** Totais do rodapé a partir dos itens já calculados. */
export function calcTotals(
  items: Array<Pick<BudgetItemCalcResult, "totalCents">>,
  adjustments: BudgetAdjustments,
): BudgetTotals {
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);

  const discountCents = resolveAdjustment(adjustments.discount, subtotalCents);
  const surchargeCents = resolveAdjustment(adjustments.surcharge, subtotalCents);
  const freightCents = resolveAdjustment(adjustments.freight, subtotalCents);
  const taxCents = resolveAdjustment(adjustments.tax, subtotalCents);

  const totalCents =
    subtotalCents - discountCents + surchargeCents + freightCents + taxCents;

  return {
    subtotalCents,
    discountCents,
    surchargeCents,
    freightCents,
    taxCents,
    // Um desconto maior que o pedido não vira total negativo.
    totalCents: Math.max(0, totalCents),
  };
}

/** Calcula itens + totais de uma vez (usado pelo formulário e pelo service). */
export function calcBudget(
  items: BudgetItemCalcInput[],
  adjustments: BudgetAdjustments,
): { items: BudgetItemCalcResult[]; totals: BudgetTotals } {
  const calculated = items.map(calcItem);
  return { items: calculated, totals: calcTotals(calculated, adjustments) };
}

/** true quando a unidade cobra por m² (habilita largura/comprimento na tela). */
export function usesArea(unit: BudgetUnit): boolean {
  return unit === "M2";
}

export const UNIT_LABEL: Record<BudgetUnit, string> = {
  M2: "M²",
  UNIDADE: "Unidade",
  PACOTE: "Pacote",
  MILHEIRO: "Milheiro",
};
