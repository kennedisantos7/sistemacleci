/**
 * Chave de agrupamento da cidade. O campo é texto livre no cadastro, então
 * "Palmas", "palmas " e "PALMAS" precisam cair no mesmo grupo — e "Araguaína"
 * digitado sem acento também.
 */
export function cityKey(city: string | null | undefined): string {
  return (city ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
