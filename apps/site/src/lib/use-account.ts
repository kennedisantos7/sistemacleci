"use client";

import { useEffect, useState } from "react";

// URL do painel (embutida no build via NEXT_PUBLIC_SISTEMA_URL).
const PAINEL_URL = process.env.NEXT_PUBLIC_SISTEMA_URL ?? "http://localhost:3001";

export type Account = {
  loggedIn: boolean;
  name?: string | null;
  home?: string;
  affiliateCode?: string | null;
};

// Cache em escopo de módulo: vários componentes (Header, sync do modo afiliado)
// usam o mesmo resultado e disparam apenas um fetch por carregamento de página.
let cached: Account | null = null;
let promise: Promise<Account> | null = null;

function fetchMe(): Promise<Account> {
  if (cached) return Promise.resolve(cached);
  if (!promise) {
    promise = fetch(`${PAINEL_URL}/api/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { loggedIn: false }))
      .catch(() => ({ loggedIn: false }) as Account)
      .then((data: Account) => {
        cached = data;
        return data;
      });
  }
  return promise;
}

/**
 * Consulta o painel (/api/me) para saber se o usuário tem sessão ativa.
 * Funciona porque site e painel são subdomínios do mesmo cleci.com.br: o
 * fetch com credenciais envia o cookie de sessão do painel (same-site) e o
 * endpoint responde com CORS liberado para a origem do site.
 * Retorna `null` enquanto carrega (tratado como deslogado na UI).
 */
export function useAccount(): Account | null {
  const [account, setAccount] = useState<Account | null>(cached);

  useEffect(() => {
    let alive = true;
    fetchMe().then((data) => {
      if (alive) setAccount(data);
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
