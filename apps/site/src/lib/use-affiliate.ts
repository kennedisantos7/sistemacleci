"use client";

import { useEffect, useState } from "react";
import { getAffiliateCode, AFFILIATE_EVENT } from "./attribution";

/** Reage à ativação/desativação do modo afiliado (localStorage + evento). */
export function useAffiliateCode(): string | null {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setCode(getAffiliateCode());
    sync();
    window.addEventListener(AFFILIATE_EVENT, sync);
    window.addEventListener("storage", sync); // sincroniza entre abas
    return () => {
      window.removeEventListener(AFFILIATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return code;
}
