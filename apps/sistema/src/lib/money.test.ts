import { describe, it, expect } from "vitest";
import {
  formatCents,
  commissionFromBps,
  bpsToPercent,
  parseReaisToCents,
  parseReaisToCentsAllowZero,
  parsePercentToBps,
  parseDecimalPtBr,
} from "./money";

describe("commissionFromBps", () => {
  it("calcula comissão simples (15% de R$100,00)", () => {
    expect(commissionFromBps(10000, 1500)).toBe(1500);
  });

  it("arredonda para o centavo mais próximo", () => {
    // 10% de R$ 12,345 (1234 cents) = 123,4 -> 123
    expect(commissionFromBps(1234, 1000)).toBe(123);
    // 10% de 1235 = 123,5 -> 124 (arredonda pra cima)
    expect(commissionFromBps(1235, 1000)).toBe(124);
  });

  it("taxa zero resulta em zero", () => {
    expect(commissionFromBps(99999, 0)).toBe(0);
  });
});

describe("parseDecimalPtBr", () => {
  it("vírgula é sempre o decimal", () => {
    expect(parseDecimalPtBr("123,45")).toBe(123.45);
    expect(parseDecimalPtBr("1.234,56")).toBe(1234.56);
  });

  it("ponto seguido de 3 dígitos é milhar", () => {
    // O bug relatado: R$ 1.500 de desconto virava R$ 1,50.
    expect(parseDecimalPtBr("1.500")).toBe(1500);
    expect(parseDecimalPtBr("12.000")).toBe(12000);
  });

  it("ponto seguido de 1 ou 2 dígitos é decimal", () => {
    expect(parseDecimalPtBr("12.5")).toBe(12.5);
    expect(parseDecimalPtBr("12.50")).toBe(12.5);
  });

  it("vários pontos são todos milhar", () => {
    expect(parseDecimalPtBr("1.234.567")).toBe(1234567);
  });

  it("ignora o que não é número (R$, %, espaço)", () => {
    expect(parseDecimalPtBr("R$ 1.234,56")).toBe(1234.56);
    expect(parseDecimalPtBr("10%")).toBe(10);
    expect(parseDecimalPtBr(" 50 ")).toBe(50);
  });

  it("tolera vírgula sobrando em vez de recusar tudo", () => {
    // Digitação em andamento no celular: "35," ainda vale 35.
    expect(parseDecimalPtBr("35,")).toBe(35);
    expect(parseDecimalPtBr(",5")).toBe(0.5);
    // Duas vírgulas: a última manda, o resto é ruído.
    expect(parseDecimalPtBr("35,5,5")).toBe(355.5);
  });

  it("recusa texto sem número nenhum", () => {
    expect(parseDecimalPtBr("abc")).toBeNull();
    expect(parseDecimalPtBr("")).toBeNull();
    expect(parseDecimalPtBr("R$")).toBeNull();
  });
});

describe("parseReaisToCents", () => {
  it("aceita vírgula decimal", () => {
    expect(parseReaisToCents("123,45")).toBe(12345);
  });
  it("aceita ponto decimal", () => {
    expect(parseReaisToCents("123.45")).toBe(12345);
  });
  it("aceita separador de milhar", () => {
    expect(parseReaisToCents("1.234,50")).toBe(123450);
    expect(parseReaisToCents("1.500")).toBe(150000);
  });
  it("rejeita valores inválidos e não-positivos", () => {
    expect(parseReaisToCents("abc")).toBeNull();
    expect(parseReaisToCents("0")).toBeNull();
    expect(parseReaisToCents("-5")).toBeNull();
  });
});

describe("parseReaisToCentsAllowZero", () => {
  it("campo vazio vale zero — é assim que se remove um desconto", () => {
    expect(parseReaisToCentsAllowZero("")).toBe(0);
    expect(parseReaisToCentsAllowZero("   ")).toBe(0);
    expect(parseReaisToCentsAllowZero("0")).toBe(0);
  });
  it("lê milhar corretamente", () => {
    expect(parseReaisToCentsAllowZero("1.500")).toBe(150000);
  });
  it("recusa negativo e texto", () => {
    expect(parseReaisToCentsAllowZero("-1")).toBeNull();
    expect(parseReaisToCentsAllowZero("abc")).toBeNull();
  });
});

describe("parsePercentToBps", () => {
  it("converte percentual em bps", () => {
    expect(parsePercentToBps("15")).toBe(1500);
    expect(parsePercentToBps("7,5")).toBe(750);
    expect(parsePercentToBps("12.5")).toBe(1250);
  });
  it("campo vazio vale zero — é assim que se remove um desconto", () => {
    expect(parsePercentToBps("")).toBe(0);
    expect(parsePercentToBps("  ")).toBe(0);
  });
  it("aceita o símbolo de porcentagem junto", () => {
    expect(parsePercentToBps("15%")).toBe(1500);
  });
  it("rejeita fora de 0..100", () => {
    expect(parsePercentToBps("101")).toBeNull();
    expect(parsePercentToBps("-1")).toBeNull();
  });
});

describe("formatação", () => {
  it("formata centavos em BRL", () => {
    expect(formatCents(123456)).toContain("1.234,56");
  });
  it("bps para percentual", () => {
    expect(bpsToPercent(1500)).toBe("15%");
  });
});
