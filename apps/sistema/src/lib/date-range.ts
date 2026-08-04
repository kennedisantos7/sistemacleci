/**
 * Faixas de data dos filtros do painel.
 *
 * Fuso: o servidor roda em UTC, mas "hoje" para o vendedor é o dia em Brasília.
 * O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo em
 * -03:00 — sem isso, das 21h à meia-noite as vendas cairiam no dia seguinte.
 */

const OFFSET_BRASILIA_MS = 3 * 60 * 60 * 1000;

export const PERIODOS = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "mes", label: "Este mês" },
  { value: "custom", label: "Personalizado" },
] as const;

export type PeriodoPreset = (typeof PERIODOS)[number]["value"];

export const PERIODO_PADRAO: PeriodoPreset = "30d";

export function isPeriodoPreset(v: string | undefined): v is PeriodoPreset {
  return PERIODOS.some((p) => p.value === v);
}

export type DateRange = {
  preset: PeriodoPreset;
  /** Início inclusivo. */
  start: Date;
  /** Fim EXCLUSIVO — comparações usam lt, nunca lte. */
  end: Date;
  label: string;
  /** Valores para preencher os campos do filtro personalizado (YYYY-MM-DD). */
  deInput: string;
  ateInput: string;
};

/** Meia-noite em Brasília do dia que contém `instante`, como instante UTC. */
export function inicioDoDia(instante: Date): Date {
  const local = new Date(instante.getTime() - OFFSET_BRASILIA_MS);
  const meiaNoiteLocal = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  return new Date(meiaNoiteLocal + OFFSET_BRASILIA_MS);
}

function somaDias(d: Date, dias: number): Date {
  return new Date(d.getTime() + dias * 86_400_000);
}

/** "YYYY-MM-DD" no fuso de Brasília — o que o <input type="date"> espera. */
export function paraInputDate(d: Date): string {
  return new Date(d.getTime() - OFFSET_BRASILIA_MS).toISOString().slice(0, 10);
}

/** Converte "YYYY-MM-DD" para a meia-noite correspondente em Brasília. */
export function deInputDate(valor: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
  if (!m) return null;
  const [, ano, mes, dia] = m;
  const instante = new Date(
    Date.UTC(Number(ano), Number(mes) - 1, Number(dia)) + OFFSET_BRASILIA_MS,
  );
  return Number.isNaN(instante.getTime()) ? null : instante;
}

function rotulo(start: Date, end: Date): string {
  const fim = somaDias(end, -1); // end é exclusivo; mostra o último dia incluído
  const f = (d: Date) => paraInputDate(d).split("-").reverse().join("/");
  return paraInputDate(start) === paraInputDate(fim) ? f(start) : `${f(start)} a ${f(fim)}`;
}

/**
 * Resolve o filtro de período a partir da query string. Entrada inválida cai no
 * padrão em vez de erro — link velho ou digitado à mão não quebra o painel.
 */
export function resolverPeriodo(
  params: { periodo?: string; de?: string; ate?: string },
  agora = new Date(),
): DateRange {
  const preset: PeriodoPreset = isPeriodoPreset(params.periodo)
    ? params.periodo
    : PERIODO_PADRAO;

  const hoje = inicioDoDia(agora);
  const amanha = somaDias(hoje, 1);

  const montar = (p: PeriodoPreset, start: Date, end: Date): DateRange => ({
    preset: p,
    start,
    end,
    label: rotulo(start, end),
    deInput: paraInputDate(start),
    ateInput: paraInputDate(somaDias(end, -1)),
  });

  if (preset === "custom") {
    const de = params.de ? deInputDate(params.de) : null;
    const ate = params.ate ? deInputDate(params.ate) : null;
    if (de && ate) {
      // Datas invertidas: troca em vez de devolver faixa vazia.
      const [inicio, fim] = de <= ate ? [de, ate] : [ate, de];
      return montar("custom", inicio, somaDias(fim, 1));
    }
    // Personalizado sem datas preenchidas ainda: mostra os últimos 30 dias.
    return montar("custom", somaDias(hoje, -29), amanha);
  }

  if (preset === "hoje") return montar("hoje", hoje, amanha);
  if (preset === "7d") return montar("7d", somaDias(hoje, -6), amanha);
  if (preset === "mes") {
    const local = new Date(hoje.getTime() - OFFSET_BRASILIA_MS);
    const primeiro = new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + OFFSET_BRASILIA_MS,
    );
    return montar("mes", primeiro, amanha);
  }
  return montar("30d", somaDias(hoje, -29), amanha);
}

/** Lista de dias (meia-noite de Brasília) cobertos pela faixa, para o gráfico. */
export function diasDaFaixa(range: DateRange, maximo = 92): Date[] {
  const dias: Date[] = [];
  for (let d = range.start; d < range.end && dias.length < maximo; d = somaDias(d, 1)) {
    dias.push(d);
  }
  return dias;
}
