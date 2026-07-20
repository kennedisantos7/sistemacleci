"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function SubmitButton({
  label,
  pendingLabel,
  variant,
  onRequestConfirm,
}: {
  label: string;
  pendingLabel: string;
  variant: "outline" | "destructive";
  onRequestConfirm: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="button" size="sm" variant={variant} disabled={pending} onClick={onRequestConfirm}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

/**
 * Botão que exige confirmação (popup nativo) antes de disparar uma Server
 * Action destrutiva/crítica — ex.: bloquear uma conta. O `<form>` só é
 * submetido de fato (`requestSubmit`) se o usuário confirmar.
 */
export function ConfirmSubmitButton({
  action,
  hidden,
  confirmMessage,
  label,
  pendingLabel = "Aguarde...",
  variant = "outline",
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  confirmMessage: string;
  label: string;
  pendingLabel?: string;
  variant?: "outline" | "destructive";
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton
        label={label}
        pendingLabel={pendingLabel}
        variant={variant}
        onRequestConfirm={() => {
          if (window.confirm(confirmMessage)) formRef.current?.requestSubmit();
        }}
      />
    </form>
  );
}
