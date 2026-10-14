"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCpfCnpj, formatCpf, formatCnpj, displayCpfCnpj } from "@/lib/cpf-cnpj";

const MASK = {
  cpf: { format: formatCpf, placeholder: "000.000.000-00", maxLength: 14 },
  cnpj: { format: formatCnpj, placeholder: "00.000.000/0000-00", maxLength: 18 },
  ambos: { format: formatCpfCnpj, placeholder: "000.000.000-00 ou 00.000.000/0000-00", maxLength: 18 },
};

/** Campo de CPF/CNPJ: a pessoa digita só os números e a pontuação entra sozinha. */
export function CpfCnpjInput({
  kind = "ambos",
  defaultValue,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue"> & {
  kind?: keyof typeof MASK;
  defaultValue?: string | null;
}) {
  const mask = MASK[kind];
  const [value, setValue] = useState(() => displayCpfCnpj(defaultValue) ?? "");
  return (
    <Input
      {...props}
      inputMode="numeric"
      placeholder={mask.placeholder}
      maxLength={mask.maxLength}
      value={value}
      onChange={(e) => setValue(mask.format(e.target.value))}
    />
  );
}
