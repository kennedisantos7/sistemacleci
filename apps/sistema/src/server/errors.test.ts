import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mensagemDoErro } from "./errors";

const FALLBACK = "Erro ao salvar o orçamento.";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("mensagemDoErro", () => {
  it("deixa passar a mensagem que o próprio sistema escreveu", () => {
    expect(mensagemDoErro(new Error("Cliente inválido."), FALLBACK)).toBe("Cliente inválido.");
  });

  it("esconde erro do Prisma — foi o que vazou na tela do vendedor", () => {
    const err = new Error(
      "Invalid `prisma.budget.create()` invocation:\n\nForeign key constraint violated on the constraint: `Budget_vendedorId_fkey`",
    );
    err.name = "PrismaClientKnownRequestError";
    expect(mensagemDoErro(err, FALLBACK)).toBe(FALLBACK);
  });

  it("esconde qualquer coisa com várias linhas (stack, dump)", () => {
    expect(mensagemDoErro(new Error("falhou\n  em algum lugar"), FALLBACK)).toBe(FALLBACK);
  });

  it("esconde mensagem longa demais para ser texto de tela", () => {
    expect(mensagemDoErro(new Error("x".repeat(250)), FALLBACK)).toBe(FALLBACK);
  });

  it("esconde o que nem é Error", () => {
    expect(mensagemDoErro("string solta", FALLBACK)).toBe(FALLBACK);
    expect(mensagemDoErro(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it("registra no log do servidor o que esconde da tela", () => {
    const spy = vi.spyOn(console, "error");
    const err = new Error("detalhe interno");
    err.name = "PrismaClientValidationError";
    mensagemDoErro(err, FALLBACK);
    expect(spy).toHaveBeenCalled();
  });

  it("não registra log quando a mensagem é para o usuário", () => {
    const spy = vi.spyOn(console, "error");
    mensagemDoErro(new Error("Só rascunhos podem ser excluídos."), FALLBACK);
    expect(spy).not.toHaveBeenCalled();
  });
});
