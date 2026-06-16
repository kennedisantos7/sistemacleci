import { describe, it, expect } from "vitest";
import {
  formatCents,
  commissionFromBps,
  bpsToPercent,
  parseReaisToCents,
  parsePercentToBps,
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

describe("parseReaisToCents", () => {
  it("aceita vírgula decimal", () => {
    expect(parseReaisToCents("123,45")).toBe(12345);
  });
  it("aceita ponto decimal", () => {
    expect(parseReaisToCents("123.45")).toBe(12345);
  });
  it("aceita separador de milhar", () => {
    expect(parseReaisToCents("1.234,50")).toBe(123450);
  });
  it("rejeita valores inválidos e não-positivos", () => {
    expect(parseReaisToCents("abc")).toBeNull();
    expect(parseReaisToCents("0")).toBeNull();
    expect(parseReaisToCents("-5")).toBeNull();
  });
});

describe("parsePercentToBps", () => {
  it("converte percentual em bps", () => {
    expect(parsePercentToBps("15")).toBe(1500);
    expect(parsePercentToBps("7,5")).toBe(750);
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
