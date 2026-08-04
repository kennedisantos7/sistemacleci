// Helpers monetários. Toda a base trabalha em CENTAVOS (Int).

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata centavos como moeda BRL. Ex: 12345 -> "R$ 123,45" */
export function formatCents(cents: number): string {
  return BRL.format(cents / 100);
}

/**
 * Calcula a comissão em centavos a partir do valor da venda e da taxa em bps.
 * Arredonda para o centavo mais próximo. Ex: amount=10000, bps=1500 -> 1500.
 */
export function commissionFromBps(amountCents: number, rateBps: number): number {
  return Math.round((amountCents * rateBps) / 10000);
}

/** Converte bps em string percentual legível. Ex: 1500 -> "15%" */
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

/**
 * Interpreta um número digitado em português. Devolve null quando o texto não
 * representa um número.
 *
 * O ponto é ambíguo em pt-BR: "1.500" é mil e quinhentos, mas "1.50" é um e
 * meio. A regra usada é a do teclado brasileiro:
 *  - vírgula presente  -> ela é o decimal, todo ponto é separador de milhar;
 *  - mais de um ponto  -> todos são milhar ("1.234.567");
 *  - um ponto só       -> milhar quando vem seguido de exatamente 3 dígitos
 *                         ("1.500"), decimal nos outros casos ("12.5", "12.50").
 *
 * Também tolera o que o usuário digita junto do número — "R$", espaço, "%" —
 * em vez de recusar o valor inteiro por causa de um prefixo.
 */
export function parseDecimalPtBr(input: string): number | null {
  // Mantém só o que pode compor um número; remove "R$", "%", espaços, NBSP.
  const limpo = input.replace(/[^\d.,-]/g, "").trim();
  if (!limpo) return null;

  const negativo = limpo.startsWith("-");
  const corpo = limpo.replace(/-/g, "");
  if (!corpo) return null;

  let normalizado: string;
  if (corpo.includes(",")) {
    // Só a última vírgula é decimal; o resto é ruído de digitação.
    const ultima = corpo.lastIndexOf(",");
    const inteiro = corpo.slice(0, ultima).replace(/[.,]/g, "");
    const decimal = corpo.slice(ultima + 1).replace(/[.,]/g, "");
    normalizado = `${inteiro || "0"}.${decimal || "0"}`;
  } else {
    const pontos = corpo.split(".").length - 1;
    if (pontos === 0) {
      normalizado = corpo;
    } else if (pontos > 1) {
      normalizado = corpo.replace(/\./g, ""); // 1.234.567
    } else {
      const [inteiro = "", decimal = ""] = corpo.split(".");
      // "1.500" = milhar; "12.5" e "12.50" = decimal.
      normalizado = decimal.length === 3 ? `${inteiro}${decimal}` : `${inteiro || "0"}.${decimal}`;
    }
  }

  const valor = Number(normalizado);
  if (!Number.isFinite(valor)) return null;
  return negativo ? -valor : valor;
}

/**
 * Converte um valor digitado em reais ("123,45", "1.500", "R$ 1.234,56") para
 * centavos. Retorna null se inválido ou não-positivo.
 */
export function parseReaisToCents(input: string): number | null {
  const valor = parseDecimalPtBr(input);
  if (valor === null || valor <= 0) return null;
  return Math.round(valor * 100);
}

/**
 * Igual a `parseReaisToCents`, mas aceita zero e campo vazio (-> 0). Usado no
 * orçamento: há produtos sem preço na tabela e desconto/frete começam zerados.
 * Retorna null só quando o texto é realmente inválido.
 */
export function parseReaisToCentsAllowZero(input: string): number | null {
  if (!input.trim()) return 0;
  const valor = parseDecimalPtBr(input);
  if (valor === null || valor < 0) return null;
  return Math.round(valor * 100);
}

// Medidas e quantidades NÃO usam parseDecimalPtBr de propósito: ali o ponto é
// sempre decimal. Ninguém escreve milhar em uma largura — quem digita "1.500"
// numa medida quer 1,5 m, e a regra do milhar transformaria isso em 1500 m.

/**
 * Converte uma medida em metros ("2", "1,5") para número com 3 casas.
 * Vazio -> null (o item ainda não foi dimensionado); inválido -> undefined.
 */
export function parseMeters(input: string): number | null | undefined {
  const s = input.trim();
  if (!s) return null;
  const value = Number(s.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0 || value > 10_000) return undefined;
  return Math.round(value * 1000) / 1000;
}

/** Formata uma medida/área para exibição (pt-BR). */
export function formatDecimal(value: number, maximumFractionDigits = 2): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

/**
 * Converte uma quantidade digitada ("2", "2,5" ou "2.5") em número com até
 * 2 casas decimais. Retorna null se inválido/não-positivo.
 */
export function parseQuantity(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 100_000) return null;
  return Math.round(value * 100) / 100;
}

/** Formata uma quantidade para exibição (pt-BR, até 2 casas). */
export function formatQuantity(quantity: number): string {
  return quantity.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/**
 * Converte percentual ("15", "15,5", "15%") em bps. Retorna null se inválido ou
 * fora de 0–100. Campo vazio vale 0 — desconto em branco é desconto nenhum.
 */
export function parsePercentToBps(input: string): number | null {
  if (!input.trim()) return 0;
  const value = parseDecimalPtBr(input);
  if (value === null || value < 0 || value > 100) return null;
  return Math.round(value * 100);
}
