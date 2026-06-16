"use client";

import { useState } from "react";
import { Check, LinkIcon } from "lucide-react";
import { useAffiliateCode } from "../lib/use-affiliate";

/**
 * Botão "Copiar meu link" exibido em cada produto quando o modo afiliado está
 * ativo. Gera a URL do produto com o ?ref= do código pessoal do afiliado.
 */
export default function AffiliateCopy({
  productId,
  className = "",
}: {
  productId: string | number;
  className?: string;
}) {
  const code = useAffiliateCode();
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  async function copy() {
    const url = `${window.location.origin}/produto/${productId}?ref=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard indisponível: ignora
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`flex w-full items-center justify-center gap-2 rounded-DEFAULT border-2 border-[#1541FC] py-2.5 text-sm font-bold text-[#1541FC] transition-colors hover:bg-[#1541FC] hover:text-white ${className}`}
    >
      {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
      {copied ? "Link copiado!" : "Copiar meu link"}
    </button>
  );
}
