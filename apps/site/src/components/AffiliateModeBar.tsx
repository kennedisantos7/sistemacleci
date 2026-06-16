"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, X } from "lucide-react";
import { captureAffiliateMode, clearAffiliateMode } from "../lib/attribution";
import { useAffiliateCode } from "../lib/use-affiliate";

export default function AffiliateModeBar() {
  const searchParams = useSearchParams();
  const code = useAffiliateCode();

  // Captura o ?aff= ao entrar/navegar (ativa o modo afiliado).
  useEffect(() => {
    captureAffiliateMode();
  }, [searchParams]);

  if (!code) return null;

  return (
    <div className="sticky top-0 z-[70] flex items-center justify-center gap-3 bg-[#1541FC] px-4 py-2 text-xs font-bold text-white sm:text-sm">
      <BadgeCheck className="h-4 w-4 shrink-0" />
      <span>
        Modo afiliado ativo — gerando links com o código{" "}
        <span className="font-mono">{code}</span>
      </span>
      <button
        type="button"
        onClick={clearAffiliateMode}
        className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 hover:bg-white/30"
        aria-label="Sair do modo afiliado"
      >
        <X className="h-3 w-3" /> Sair
      </button>
    </div>
  );
}
