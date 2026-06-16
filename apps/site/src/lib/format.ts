const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor em centavos como moeda BRL. Ex: 12345 -> "R$ 123,45" */
export function formatCents(cents: number): string {
  return BRL.format(cents / 100);
}
