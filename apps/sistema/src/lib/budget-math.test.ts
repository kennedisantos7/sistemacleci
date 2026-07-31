import { describe, it, expect } from "vitest";
import {
  calcAreaM2,
  calcItem,
  calcTotals,
  calcBudget,
  resolveAdjustment,
  ZERO_ADJUSTMENT,
  type BudgetAdjustments,
} from "./budget-math";

const NO_ADJUSTMENTS: BudgetAdjustments = {
  discount: ZERO_ADJUSTMENT,
  surcharge: ZERO_ADJUSTMENT,
  freight: ZERO_ADJUSTMENT,
  tax: ZERO_ADJUSTMENT,
};

describe("calcAreaM2", () => {
  it("multiplica largura por comprimento", () => {
    expect(calcAreaM2(2, 3)).toBe(6);
    expect(calcAreaM2(1.5, 0.8)).toBe(1.2);
  });

  it("arredonda em 4 casas (sem lixo de ponto flutuante)", () => {
    expect(calcAreaM2(0.1, 0.2)).toBe(0.02); // 0.1*0.2 = 0.020000000000000004
    expect(calcAreaM2(1.11111, 1.11111)).toBe(1.2346);
  });
});

describe("calcItem — unidade M2", () => {
  it("cobra o preço por m² e multiplica pela quantidade", () => {
    // TAPETE NAYCLECI PERSON. C/JATO DE TINTA — R$ 380,00/m², 2m × 1,5m, qtd 2
    const r = calcItem({
      unit: "M2",
      unitPriceCents: 38_000,
      widthM: 2,
      lengthM: 1.5,
      quantity: 2,
    });
    expect(r.areaM2).toBe(3);
    expect(r.partialCents).toBe(114_000); // R$ 1.140,00
    expect(r.totalCents).toBe(228_000); // R$ 2.280,00
  });

  it("sem dimensões preenchidas resulta em zero (linha ainda em branco)", () => {
    const r = calcItem({ unit: "M2", unitPriceCents: 38_000, quantity: 1 });
    expect(r.areaM2).toBe(0);
    expect(r.partialCents).toBe(0);
    expect(r.totalCents).toBe(0);
  });

  it("arredonda o parcial para o centavo", () => {
    // R$ 299,80/m² × 0,333 m² = R$ 99,8334 -> R$ 99,83
    const r = calcItem({
      unit: "M2",
      unitPriceCents: 29_980,
      widthM: 0.333,
      lengthM: 1,
      quantity: 1,
    });
    expect(r.partialCents).toBe(9_983);
  });
});

describe("calcItem — unidades sem área", () => {
  it.each(["UNIDADE", "PACOTE", "MILHEIRO"] as const)(
    "%s: parcial é o próprio preço e o total é preço × qtd",
    (unit) => {
      const r = calcItem({ unit, unitPriceCents: 14_000, quantity: 3 });
      expect(r.areaM2).toBeNull();
      expect(r.partialCents).toBe(14_000);
      expect(r.totalCents).toBe(42_000);
    },
  );

  it("ignora largura/comprimento digitados por engano", () => {
    const r = calcItem({
      unit: "UNIDADE",
      unitPriceCents: 8_500,
      widthM: 5,
      lengthM: 5,
      quantity: 1,
    });
    expect(r.areaM2).toBeNull();
    expect(r.totalCents).toBe(8_500);
  });

  it("aceita quantidade fracionada", () => {
    const r = calcItem({ unit: "UNIDADE", unitPriceCents: 10_000, quantity: 2.5 });
    expect(r.totalCents).toBe(25_000);
  });
});

describe("resolveAdjustment", () => {
  it("modo VALOR usa o valor digitado em centavos", () => {
    expect(resolveAdjustment({ mode: "VALOR", input: 21_000 }, 500_000)).toBe(21_000);
  });

  it("modo PERCENTUAL aplica bps sobre o subtotal", () => {
    expect(resolveAdjustment({ mode: "PERCENTUAL", input: 1_000 }, 500_000)).toBe(50_000); // 10%
    expect(resolveAdjustment({ mode: "PERCENTUAL", input: 550 }, 123_456)).toBe(6_790); // 5,5%
  });

  it("percentual sobre subtotal zero é zero", () => {
    expect(resolveAdjustment({ mode: "PERCENTUAL", input: 1_500 }, 0)).toBe(0);
  });
});

describe("calcTotals", () => {
  it("soma os itens no subtotal", () => {
    const t = calcTotals([{ totalCents: 100_000 }, { totalCents: 55_500 }], NO_ADJUSTMENTS);
    expect(t.subtotalCents).toBe(155_500);
    expect(t.totalCents).toBe(155_500);
  });

  it("total final = subtotal − desconto + adicional + frete + imposto", () => {
    const t = calcTotals([{ totalCents: 500_000 }], {
      discount: { mode: "VALOR", input: 21_000 }, // R$ 210,00 (o da planilha)
      surcharge: { mode: "VALOR", input: 5_000 },
      freight: { mode: "VALOR", input: 8_000 },
      tax: { mode: "VALOR", input: 2_500 },
    });
    expect(t.discountCents).toBe(21_000);
    expect(t.totalCents).toBe(494_500);
  });

  it("mistura R$ e % no mesmo orçamento", () => {
    const t = calcTotals([{ totalCents: 200_000 }], {
      discount: { mode: "PERCENTUAL", input: 1_000 }, // 10% = 20.000
      surcharge: ZERO_ADJUSTMENT,
      freight: { mode: "VALOR", input: 15_000 },
      tax: { mode: "PERCENTUAL", input: 500 }, // 5% = 10.000
    });
    expect(t.discountCents).toBe(20_000);
    expect(t.taxCents).toBe(10_000);
    expect(t.totalCents).toBe(205_000);
  });

  it("desconto maior que o pedido não gera total negativo", () => {
    const t = calcTotals([{ totalCents: 10_000 }], {
      ...NO_ADJUSTMENTS,
      discount: { mode: "VALOR", input: 50_000 },
    });
    expect(t.totalCents).toBe(0);
  });

  it("orçamento vazio zera tudo", () => {
    expect(calcTotals([], NO_ADJUSTMENTS)).toMatchObject({
      subtotalCents: 0,
      totalCents: 0,
    });
  });
});

describe("calcBudget — pedido completo", () => {
  it("reproduz um pedido misto de ponta a ponta", () => {
    const { items, totals } = calcBudget(
      [
        // 2047 TAPETE NAYCLECI PERSON. C/JATO DE TINTA — R$ 380/m², 2×1m, qtd 1
        { unit: "M2", unitPriceCents: 38_000, widthM: 2, lengthM: 1, quantity: 1 },
        // 2202 BONÉS PERS. LINHA PADRÃO — R$ 28,90, qtd 50
        { unit: "UNIDADE", unitPriceCents: 2_890, quantity: 50 },
        // 8171 CARTÃO DE VISITA MILHEIRO — R$ 140,00, qtd 2
        { unit: "PACOTE", unitPriceCents: 14_000, quantity: 2 },
      ],
      {
        discount: { mode: "VALOR", input: 21_000 },
        surcharge: ZERO_ADJUSTMENT,
        freight: ZERO_ADJUSTMENT,
        tax: ZERO_ADJUSTMENT,
      },
    );

    expect(items[0]).toMatchObject({ areaM2: 2, partialCents: 76_000, totalCents: 76_000 });
    expect(items[1]).toMatchObject({ areaM2: null, totalCents: 144_500 });
    expect(items[2]).toMatchObject({ areaM2: null, totalCents: 28_000 });

    expect(totals.subtotalCents).toBe(248_500); // R$ 2.485,00
    expect(totals.totalCents).toBe(227_500); // − R$ 210,00 = R$ 2.275,00
  });
});
