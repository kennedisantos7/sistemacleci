/**
 * As contas de teste e a home de cada papel.
 *
 * As contas são criadas por `pnpm db:seed:e2e` (packages/db/prisma/seed-e2e.ts).
 * A home de cada papel é o ROLE_HOME do sistema (apps/sistema/src/lib/rbac.ts) —
 * se mudar lá, muda aqui.
 */

export const PAPEIS = [
  "admin",
  "dev",
  "gerente",
  "vendedor",
  "vendedor2",
  "afiliado",
] as const;

export type Papel = (typeof PAPEIS)[number];

export type Conta = {
  email: string;
  /** Para onde o sistema manda logo após o login. */
  home: string;
};

export const CONTAS: Record<Papel, Conta> = {
  admin: { email: "teste-admin@cleci.com.br", home: "/admin" },
  dev: { email: "teste-dev@cleci.com.br", home: "/admin" },
  gerente: { email: "teste-gerente@cleci.com.br", home: "/admin" },
  vendedor: { email: "teste-vendedor@cleci.com.br", home: "/vendedor" },
  vendedor2: { email: "teste-vendedor2@cleci.com.br", home: "/vendedor" },
  afiliado: { email: "teste-afiliado@cleci.com.br", home: "/afiliado" },
};

/** Contas que existem justamente para provar que NÃO logam. */
export const CONTAS_BLOQUEADAS = {
  pendente: "teste-pendente@cleci.com.br",
  bloqueado: "teste-bloqueado@cleci.com.br",
} as const;

/** Código de afiliação fixo do afiliado de teste (para /go/<ref> e venda manual). */
export const REF_AFILIADO = "TESTE001";

/** Sessão gravada de cada papel. O diretório está no .gitignore. */
export function arquivoDeSessao(papel: Papel): string {
  return `playwright/.auth/${papel}.json`;
}

export function senhaDeTeste(): string {
  const senha = process.env.TEST_PASSWORD;
  if (!senha) {
    throw new Error(
      "TEST_PASSWORD não definida. Copie apps/e2e/.env.example para .env e preencha, " +
        "e rode `pnpm db:seed:e2e` para criar as contas.",
    );
  }
  return senha;
}
