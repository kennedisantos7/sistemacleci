import { describe, it, expect } from "vitest";
import { BudgetDocType } from "@cleci/db";
import { resolverDocType, podeConverterEmPedido, DOC_TYPE_LABEL, docPath } from "./doc-type";

const { ORCAMENTO, PEDIDO } = BudgetDocType;

describe("resolverDocType", () => {
  it("orçamento vira pedido", () => {
    expect(resolverDocType(ORCAMENTO, PEDIDO)).toBe(PEDIDO);
  });

  it("pedido NÃO volta a ser orçamento", () => {
    // A regra central: o cliente já recebeu o pedido como documento de
    // fechamento, com cláusulas e assinatura.
    expect(resolverDocType(PEDIDO, ORCAMENTO)).toBe(PEDIDO);
  });

  it("pedido continua pedido", () => {
    expect(resolverDocType(PEDIDO, PEDIDO)).toBe(PEDIDO);
  });

  it("orçamento continua orçamento", () => {
    expect(resolverDocType(ORCAMENTO, ORCAMENTO)).toBe(ORCAMENTO);
  });

  it("documento novo aceita os dois tipos", () => {
    expect(resolverDocType(null, ORCAMENTO)).toBe(ORCAMENTO);
    expect(resolverDocType(null, PEDIDO)).toBe(PEDIDO);
  });
});

describe("podeConverterEmPedido", () => {
  it("só orçamento pode converter", () => {
    expect(podeConverterEmPedido(ORCAMENTO)).toBe(true);
    expect(podeConverterEmPedido(PEDIDO)).toBe(false);
  });
});

describe("DOC_TYPE_LABEL", () => {
  it("nomeia os dois documentos", () => {
    expect(DOC_TYPE_LABEL.ORCAMENTO).toBe("Orçamento");
    expect(DOC_TYPE_LABEL.PEDIDO).toBe("Pedido");
  });
});

describe("docPath", () => {
  it("cada documento mora na sua seção", () => {
    expect(docPath(ORCAMENTO)).toBe("/orcamentos");
    expect(docPath(PEDIDO)).toBe("/pedidos");
  });

  it("monta subrotas", () => {
    expect(docPath(ORCAMENTO, "abc")).toBe("/orcamentos/abc");
    expect(docPath(PEDIDO, "abc", "editar")).toBe("/pedidos/abc/editar");
    expect(docPath(PEDIDO, "novo")).toBe("/pedidos/novo");
  });
});
