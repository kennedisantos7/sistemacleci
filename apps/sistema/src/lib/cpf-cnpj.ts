/**
 * Máscara de CPF/CNPJ. Quem digita só põe os números; até 11 dígitos sai como
 * CPF (000.000.000-00), de 12 a 14 como CNPJ (00.000.000/0000-00). Também
 * serve para exibir documentos antigos que foram salvos sem pontuação.
 */
export function formatCpfCnpj(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Igual ao formatCpfCnpj, mas preserva o que não for documento (ex.: texto livre). */
export function displayCpfCnpj(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = value.replace(/\D/g, "");
  return d.length === 11 || d.length === 14 ? formatCpfCnpj(d) : value;
}

/** Só CPF: até 11 dígitos, 000.000.000-00. */
export function formatCpf(value: string): string {
  return formatCpfCnpj(value.replace(/\D/g, "").slice(0, 11));
}

/** Só CNPJ: até 14 dígitos, 00.000.000/0000-00 desde o primeiro número. */
export function formatCnpj(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
