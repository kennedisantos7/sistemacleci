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
