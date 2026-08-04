import { describe, it, expect } from "vitest";
import {
  resolverPeriodo,
  inicioDoDia,
  paraInputDate,
  deInputDate,
  diasDaFaixa,
  isPeriodoPreset,
} from "./date-range";

// 4/8/2026 às 01:30 UTC = 3/8/2026 às 22:30 em Brasília.
const NOITE = new Date("2026-08-04T01:30:00Z");
// 4/8/2026 às 15:00 UTC = 4/8/2026 às 12:00 em Brasília.
const MEIO_DIA = new Date("2026-08-04T15:00:00Z");

describe("inicioDoDia (fuso de Brasília)", () => {
  it("22h30 em Brasília ainda é o dia 3, não o 4", () => {
    // Sem o ajuste de fuso, a venda das 22h cairia no dia seguinte.
    expect(paraInputDate(inicioDoDia(NOITE))).toBe("2026-08-03");
  });

  it("meio-dia cai no próprio dia", () => {
    expect(paraInputDate(inicioDoDia(MEIO_DIA))).toBe("2026-08-04");
  });

  it("a meia-noite de Brasília é 03:00 UTC", () => {
    expect(inicioDoDia(MEIO_DIA).toISOString()).toBe("2026-08-04T03:00:00.000Z");
  });
});

describe("deInputDate e paraInputDate", () => {
  it("ida e volta preserva a data", () => {
    const d = deInputDate("2026-02-15");
    expect(d).not.toBeNull();
    expect(paraInputDate(d!)).toBe("2026-02-15");
  });

  it("recusa texto que não é data", () => {
    expect(deInputDate("15/02/2026")).toBeNull();
    expect(deInputDate("")).toBeNull();
    expect(deInputDate("2026-2-5")).toBeNull();
  });
});

describe("resolverPeriodo", () => {
  it("sem parâmetro usa 30 dias", () => {
    const r = resolverPeriodo({}, MEIO_DIA);
    expect(r.preset).toBe("30d");
    expect(r.deInput).toBe("2026-07-06");
    expect(r.ateInput).toBe("2026-08-04");
  });

  it("preset inválido cai no padrão em vez de quebrar", () => {
    expect(resolverPeriodo({ periodo: "sei-la" }, MEIO_DIA).preset).toBe("30d");
  });

  it("hoje cobre exatamente um dia", () => {
    const r = resolverPeriodo({ periodo: "hoje" }, MEIO_DIA);
    expect(r.deInput).toBe("2026-08-04");
    expect(r.ateInput).toBe("2026-08-04");
    expect(diasDaFaixa(r)).toHaveLength(1);
  });

  it("7 dias inclui hoje e os 6 anteriores", () => {
    const r = resolverPeriodo({ periodo: "7d" }, MEIO_DIA);
    expect(r.deInput).toBe("2026-07-29");
    expect(diasDaFaixa(r)).toHaveLength(7);
  });

  it("este mês começa no dia 1º", () => {
    const r = resolverPeriodo({ periodo: "mes" }, MEIO_DIA);
    expect(r.deInput).toBe("2026-08-01");
    expect(r.ateInput).toBe("2026-08-04");
  });

  it("o fim é exclusivo — cobre o último dia inteiro", () => {
    const r = resolverPeriodo({ periodo: "hoje" }, MEIO_DIA);
    // 23:59 do dia 4 em Brasília ainda entra na faixa.
    const fimDoDia = new Date("2026-08-05T02:59:00Z");
    expect(fimDoDia < r.end).toBe(true);
    expect(new Date("2026-08-05T03:00:00Z") < r.end).toBe(false);
  });

  it("personalizado respeita as datas informadas", () => {
    const r = resolverPeriodo(
      { periodo: "custom", de: "2026-01-10", ate: "2026-01-20" },
      MEIO_DIA,
    );
    expect(r.deInput).toBe("2026-01-10");
    expect(r.ateInput).toBe("2026-01-20");
    expect(diasDaFaixa(r)).toHaveLength(11);
  });

  it("datas invertidas são trocadas em vez de gerar faixa vazia", () => {
    const r = resolverPeriodo(
      { periodo: "custom", de: "2026-01-20", ate: "2026-01-10" },
      MEIO_DIA,
    );
    expect(r.deInput).toBe("2026-01-10");
    expect(r.ateInput).toBe("2026-01-20");
  });

  it("personalizado sem datas cai nos últimos 30 dias", () => {
    const r = resolverPeriodo({ periodo: "custom" }, MEIO_DIA);
    expect(r.preset).toBe("custom");
    expect(r.deInput).toBe("2026-07-06");
  });

  it("rótulo de um dia só não repete a data", () => {
    expect(resolverPeriodo({ periodo: "hoje" }, MEIO_DIA).label).toBe("04/08/2026");
  });

  it("rótulo de faixa mostra início e fim", () => {
    expect(resolverPeriodo({ periodo: "7d" }, MEIO_DIA).label).toBe("29/07/2026 a 04/08/2026");
  });
});

describe("diasDaFaixa", () => {
  it("limita a quantidade de barras do gráfico", () => {
    const r = resolverPeriodo({ periodo: "custom", de: "2020-01-01", ate: "2026-01-01" }, MEIO_DIA);
    expect(diasDaFaixa(r).length).toBeLessThanOrEqual(92);
  });
});

describe("isPeriodoPreset", () => {
  it("aceita os presets conhecidos", () => {
    expect(isPeriodoPreset("hoje")).toBe(true);
    expect(isPeriodoPreset("custom")).toBe(true);
  });

  it("recusa o resto", () => {
    expect(isPeriodoPreset("ontem")).toBe(false);
    expect(isPeriodoPreset(undefined)).toBe(false);
  });
});
