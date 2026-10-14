import { describe, it, expect } from "vitest";
import { formatCpfCnpj, displayCpfCnpj } from "./cpf-cnpj";

describe("formatCpfCnpj", () => {
  it("formata CPF completo", () => {
    expect(formatCpfCnpj("16123522191")).toBe("161.235.221-91");
  });

  it("formata CNPJ completo", () => {
    expect(formatCpfCnpj("28402051000169")).toBe("28.402.051/0001-69");
  });

  it("vai formatando enquanto digita", () => {
    expect(formatCpfCnpj("161")).toBe("161");
    expect(formatCpfCnpj("1612")).toBe("161.2");
    expect(formatCpfCnpj("1612352")).toBe("161.235.2");
    expect(formatCpfCnpj("1612352219")).toBe("161.235.221-9");
    expect(formatCpfCnpj("284020510001")).toBe("28.402.051/0001");
    expect(formatCpfCnpj("2840205100016")).toBe("28.402.051/0001-6");
  });

  it("ignora o que não é número e corta em 14 dígitos", () => {
    expect(formatCpfCnpj("28.402.051/0001-69999")).toBe("28.402.051/0001-69");
    expect(formatCpfCnpj("")).toBe("");
  });
});

describe("displayCpfCnpj", () => {
  it("pontua documento salvo só com números", () => {
    expect(displayCpfCnpj("28402051000169")).toBe("28.402.051/0001-69");
  });

  it("mantém valor que não é CPF nem CNPJ", () => {
    expect(displayCpfCnpj("isento")).toBe("isento");
    expect(displayCpfCnpj(null)).toBeNull();
  });
});
