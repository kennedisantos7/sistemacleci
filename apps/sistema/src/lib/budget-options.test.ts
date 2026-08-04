import { describe, it, expect } from "vitest";
import {
  FORMAS_PAGAMENTO,
  PRAZOS_ENTREGA,
  CIDADES_TOCANTINS,
  validarFormaPagamento,
  validarPrazoEntrega,
  validarCidadeEntrega,
} from "./budget-options";

describe("listas de opções", () => {
  it("oferece as três formas de pagamento", () => {
    expect(FORMAS_PAGAMENTO).toEqual(["PIX", "CRÉDITO", "BOLETO"]);
  });

  it("oferece prazos de 7 a 30 dias", () => {
    expect(PRAZOS_ENTREGA).toHaveLength(24);
    expect(PRAZOS_ENTREGA[0]).toBe("7 dias");
    expect(PRAZOS_ENTREGA.at(-1)).toBe("30 dias");
  });

  it("traz os 139 municípios do Tocantins, em ordem e sem repetição", () => {
    expect(CIDADES_TOCANTINS).toHaveLength(139);
    expect(new Set(CIDADES_TOCANTINS).size).toBe(139);
    expect(CIDADES_TOCANTINS).toContain("Palmas");
    expect(CIDADES_TOCANTINS).toContain("Porto Nacional");
    expect(CIDADES_TOCANTINS).toContain("Gurupi");
  });
});

describe("validarFormaPagamento", () => {
  it.each(["PIX", "CRÉDITO", "BOLETO"])("aceita %s", (valor) => {
    expect(validarFormaPagamento(valor)).toBe(valor);
  });

  it("vazio vira null (campo é opcional)", () => {
    expect(validarFormaPagamento("")).toBeNull();
    expect(validarFormaPagamento("   ")).toBeNull();
  });

  it("recusa valor fora da lista", () => {
    expect(validarFormaPagamento("DINHEIRO")).toBeNull();
    expect(validarFormaPagamento("pix")).toBeNull(); // caixa diferente não passa
  });

  it("preserva o valor legado do orçamento em edição", () => {
    // Orçamento criado quando o campo era texto livre.
    expect(validarFormaPagamento("Pix à vista", "Pix à vista")).toBe("Pix à vista");
  });

  it("não aceita valor arbitrário só porque existe um legado diferente", () => {
    expect(validarFormaPagamento("QUALQUER COISA", "Pix à vista")).toBeNull();
  });
});

describe("validarPrazoEntrega", () => {
  it("aceita prazo da lista", () => {
    expect(validarPrazoEntrega("15 dias")).toBe("15 dias");
    expect(validarPrazoEntrega("7 dias")).toBe("7 dias");
    expect(validarPrazoEntrega("30 dias")).toBe("30 dias");
  });

  it("recusa prazo fora da faixa de 7 a 30", () => {
    expect(validarPrazoEntrega("3 dias")).toBeNull();
    expect(validarPrazoEntrega("45 dias")).toBeNull();
  });

  it("preserva o valor legado", () => {
    expect(validarPrazoEntrega("2 semanas", "2 semanas")).toBe("2 semanas");
  });
});

describe("validarCidadeEntrega", () => {
  it("aceita cidade do Tocantins", () => {
    expect(validarCidadeEntrega("Gurupi")).toBe("Gurupi");
  });

  it("aceita cidade de fora do estado — a Cleci entrega fora do TO", () => {
    expect(validarCidadeEntrega("Goiânia")).toBe("Goiânia");
  });

  it("vazio vira null", () => {
    expect(validarCidadeEntrega("  ")).toBeNull();
  });

  it("limita o tamanho para não estourar a coluna", () => {
    expect(validarCidadeEntrega("x".repeat(300))).toHaveLength(120);
  });
});
