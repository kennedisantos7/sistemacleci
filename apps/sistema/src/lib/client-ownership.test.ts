import { describe, it, expect } from "vitest";
import {
  DIAS_ATE_LIBERAR,
  statusTitularidade,
  vencimentoTitularidade,
  diasRestantes,
  ehTitular,
  podeVerDetalhes,
  podeEditar,
  podeAssumir,
} from "./client-ownership";

const AGORA = new Date("2026-08-04T12:00:00Z");
const diasAtras = (d: number) => new Date(AGORA.getTime() - d * 86_400_000);

const titular = { id: "u-titular", role: "VENDEDOR_FIXO" as const };
const outro = { id: "u-outro", role: "VENDEDOR_FIXO" as const };
const gerente = { id: "u-gerente", role: "GERENTE" as const };
const admin = { id: "u-admin", role: "ADMIN" as const };

const comAtividade = (dias: number) => ({
  vendedorId: titular.id,
  lastActivityAt: diasAtras(dias),
});

describe("statusTitularidade", () => {
  it("sem titular a empresa está livre", () => {
    const s = statusTitularidade({ vendedorId: null, lastActivityAt: null }, AGORA);
    expect(s.kind).toBe("livre");
  });

  it("atividade recente mantém bloqueada", () => {
    const s = statusTitularidade(comAtividade(3), AGORA);
    expect(s.kind).toBe("bloqueada");
    expect(s.diasRestantes).toBe(DIAS_ATE_LIBERAR - 3);
  });

  it("no último dia do prazo ainda está bloqueada", () => {
    const s = statusTitularidade(comAtividade(29), AGORA);
    expect(s.kind).toBe("bloqueada");
    expect(s.diasRestantes).toBe(1);
  });

  it("exatamente 30 dias sem atividade já libera", () => {
    expect(statusTitularidade(comAtividade(30), AGORA).kind).toBe("disponivel");
  });

  it("muito tempo parada continua disponível", () => {
    expect(statusTitularidade(comAtividade(400), AGORA).kind).toBe("disponivel");
  });

  it("titular sem data de atividade não bloqueia para sempre", () => {
    // Registro que escapou do backfill: melhor liberar do que travar eterno.
    const s = statusTitularidade({ vendedorId: titular.id, lastActivityAt: null }, AGORA);
    expect(s.kind).toBe("disponivel");
  });
});

describe("vencimentoTitularidade e diasRestantes", () => {
  it("o vencimento é 30 dias após a última atividade", () => {
    expect(vencimentoTitularidade(new Date("2026-08-01T00:00:00Z")).toISOString()).toBe(
      "2026-08-31T00:00:00.000Z",
    );
  });

  it("arredonda para cima: fração de dia ainda conta como dia", () => {
    const expira = new Date(AGORA.getTime() + 1.2 * 86_400_000);
    expect(diasRestantes(expira, AGORA)).toBe(2);
  });

  it("prazo vencido devolve zero, nunca negativo", () => {
    expect(diasRestantes(diasAtras(5), AGORA)).toBe(0);
  });
});

describe("ehTitular", () => {
  it("reconhece o titular", () => {
    expect(ehTitular(titular, comAtividade(1))).toBe(true);
    expect(ehTitular(outro, comAtividade(1))).toBe(false);
  });

  it("empresa sem titular não pertence a ninguém", () => {
    expect(ehTitular(titular, { vendedorId: null, lastActivityAt: null })).toBe(false);
  });
});

describe("podeVerDetalhes", () => {
  it("o titular vê a própria empresa", () => {
    expect(podeVerDetalhes(titular, comAtividade(1), AGORA)).toBe(true);
  });

  it("outro vendedor NÃO vê o contato de empresa bloqueada", () => {
    // O ponto do bloqueio: sem isso bastava copiar o telefone e ligar.
    expect(podeVerDetalhes(outro, comAtividade(1), AGORA)).toBe(false);
  });

  it("outro vendedor vê quando o prazo venceu", () => {
    expect(podeVerDetalhes(outro, comAtividade(45), AGORA)).toBe(true);
  });

  it("gerente e admin veem tudo, inclusive bloqueada", () => {
    expect(podeVerDetalhes(gerente, comAtividade(1), AGORA)).toBe(true);
    expect(podeVerDetalhes(admin, comAtividade(1), AGORA)).toBe(true);
  });
});

describe("podeEditar", () => {
  it("só o titular e a equipe administrativa editam", () => {
    expect(podeEditar(titular, comAtividade(1))).toBe(true);
    expect(podeEditar(gerente, comAtividade(1))).toBe(true);
    expect(podeEditar(outro, comAtividade(1))).toBe(false);
  });

  it("prazo vencido não dá direito de editar sem assumir antes", () => {
    expect(podeEditar(outro, comAtividade(45))).toBe(false);
  });
});

describe("podeAssumir", () => {
  it("empresa livre pode ser pega", () => {
    expect(podeAssumir(outro, { vendedorId: null, lastActivityAt: null }, AGORA)).toBe(true);
  });

  it("empresa bloqueada não pode ser pega", () => {
    expect(podeAssumir(outro, comAtividade(2), AGORA)).toBe(false);
  });

  it("empresa parada além do prazo pode ser pega", () => {
    expect(podeAssumir(outro, comAtividade(31), AGORA)).toBe(true);
  });

  it("o titular não assume o que já é dele", () => {
    expect(podeAssumir(titular, comAtividade(90), AGORA)).toBe(false);
  });
});
