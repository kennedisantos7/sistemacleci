"use client";

import { useEffect, useState } from "react";

// URL do painel (embutida no build via NEXT_PUBLIC_SISTEMA_URL).
const PAINEL_URL = process.env.NEXT_PUBLIC_SISTEMA_URL ?? "http://localhost:3001";

export type Account = {
  loggedIn: boolean;
  name?: string | null;
  home?: string;
};

/**
 * Consulta o painel (/api/me) para saber se o usuário tem sessão ativa.
 * Funciona porque site e painel são subdomínios do mesmo cleci.com.br: o
 * fetch com credenciais envia o cookie de sessão do painel (same-site) e o
 * endpoint responde com CORS liberado para a origem do site.
 * Retorna `null` enquanto carrega (tratado como deslogado na UI).
 */
export function useAccount(): Account | null {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${PAINEL_URL}/api/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { loggedIn: false }))
      .then((data: Account) => {
        if (alive) setAccount(data);
      })
      .catch(() => {
        if (alive) setAccount({ loggedIn: false });
      });
    return () => {
      alive = false;
    };
  }, []);

  return account;
}

/** Primeiro nome (para exibir no botão da conta). */
export function firstName(name?: string | null): string | null {
  if (!name) return null;
  return name.trim().split(/\s+/)[0] ?? null;
}
