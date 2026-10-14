"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCpfCnpj, displayCpfCnpj } from "@/lib/cpf-cnpj";

/** Campo de CPF/CNPJ: a pessoa digita só os números e a pontuação entra sozinha. */
export function CpfCnpjInput({
  defaultValue,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue"> & {
  defaultValue?: string | null;
}) {
  const [value, setValue] = useState(() => displayCpfCnpj(defaultValue) ?? "");
  return (
    <Input
      {...props}
      inputMode="numeric"
      placeholder="000.000.000-00 ou 00.000.000/0000-00"
      maxLength={18}
      value={value}
      onChange={(e) => setValue(formatCpfCnpj(e.target.value))}
    />
  );
}
