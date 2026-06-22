"use client";

import { useState } from "react";
import { Check, MessageCircle, CreditCard } from "lucide-react";
import { useAffiliateCode } from "../lib/use-affiliate";

/**
 * Botões "Copiar meu link" exibidos em cada produto quando o modo afiliado
 * está ativo. Gera DOIS links com o ?ref= pessoal do afiliado:
 *  - WhatsApp (fechamento): leva o cliente ao produto, que fecha no WhatsApp.
 *  - Pagamento (gateway): mesma página com o checkout online liberado (?pagar=1).
 * A atribuição (ref) é capturada por cookie em ambos os casos.
 */
export default function AffiliateCopy({
  productId,
  className = "",
}: {
  productId: string | number;
  className?: string;
}) {
  const code = useAffiliateCode();
  const [copied, setCopied] = useState<"wa" | "pay" | null>(null);

  if (!code) return null;

  function buildUrl(kind: "wa" | "pay") {
    const base = `${window.location.origin}/produto/${productId}?ref=${code}`;
    return kind === "pay" ? `${base}&pagar=1` : base;
  }

  async function copy(kind: "wa" | "pay") {
    try {
      await navigator.clipboard.writeText(buildUrl(kind));
      setCopied(kind);
      setTimeout(() => setCopied((c) => (c === kind ? null : c)), 1500);
    } catch {
      // clipboard indisponível: ignora
    }
  }

  return (
    <div className={`space-y-2 rounded-lg border border-dashed border-[#1541FC]/40 bg-[#1541FC]/5 p-3 ${className}`}>
      <p className="text-center text-[11px] font-bold uppercase tracking-wider text-[#1541FC]">
        Modo afiliado — copie e envie
      </p>

      {/* Link de fechamento por WhatsApp (comissão menor) */}
      <button
        type="button"
        onClick={() => copy("wa")}
        className="flex w-full items-center justify-center gap-2 rounded-DEFAULT border-2 border-[#25D366] py-2.5 text-sm font-bold text-[#1da851] transition-colors hover:bg-[#25D366] hover:text-white"
      >
        {copied === "wa" ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {copied === "wa" ? "Link copiado!" : "Copiar link (WhatsApp)"}
      </button>

      {/* Link de venda direta no gateway (comissão maior) */}
      <button
        type="button"
        onClick={() => copy("pay")}
        className="flex w-full items-center justify-center gap-2 rounded-DEFAULT border-2 border-[#1541FC] py-2.5 text-sm font-bold text-[#1541FC] transition-colors hover:bg-[#1541FC] hover:text-white"
      >
        {copied === "pay" ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
        {copied === "pay" ? "Link copiado!" : "Copiar link (Pagamento)"}
      </button>
    </div>
  );
}
