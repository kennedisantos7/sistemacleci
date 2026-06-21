"use client";

import { useEffect } from "react";
import { useAccount } from "../lib/use-account";
import { setAffiliateMode, clearAffiliateMode, getAffiliateCode } from "../lib/attribution";

/**
 * Amarra o "modo afiliado" do site à sessão do painel:
 * - logado como vendedor/afiliado (com código) → ativa o modo automaticamente;
 * - sessão encerrada/expirada → desativa o modo.
 * Assim, enquanto a conta estiver logada (mesmo após fechar e reabrir o
 * navegador), o afiliado já cai direto no modo afiliado.
 */
export default function AccountAffiliateSync() {
  const account = useAccount();

  useEffect(() => {
    if (!account) return; // ainda carregando

    if (account.loggedIn && account.affiliateCode) {
      if (getAffiliateCode() !== account.affiliateCode) {
        setAffiliateMode(account.affiliateCode);
      }
    } else if (account.loggedIn === false) {
      if (getAffiliateCode()) clearAffiliateMode();
    }
  }, [account]);

  return null;
}
