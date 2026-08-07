import type { Role } from "@cleci/db";

// --------------------------- Grupos de papéis ---------------------------
/** Acesso total ao sistema (idêntico ao admin). */
export const FULL_ACCESS_ROLES: Role[] = ["ADMIN", "DESENVOLVEDOR"];
/** Equipe com acesso à área administrativa (/admin). */
export const STAFF_ROLES: Role[] = ["ADMIN", "DESENVOLVEDOR", "GERENTE"];
/** Papéis de venda (painéis próprios, sem acesso administrativo). */
export const SELLER_ROLES: Role[] = ["VENDEDOR_FIXO", "AFILIADO"];
/** Quem acumula comissão e pode solicitar saque (afiliado e desenvolvedor). */
export const EARNER_ROLES: Role[] = ["AFILIADO", "DESENVOLVEDOR"];
/** Quem monta orçamento/pedido e gerencia clientes. Afiliado e design ficam de fora. */
export const BUDGET_ROLES: Role[] = ["ADMIN", "DESENVOLVEDOR", "GERENTE", "VENDEDOR_FIXO"];
/**
 * Quem trabalha a arte. O designer só enxerga orçamentos que foram enviados
 * para o design (ver o escopo em services/budgets.ts) — a equipe administrativa
 * entra junto para acompanhar a fila.
 */
export const DESIGN_ROLES: Role[] = ["DESIGN", "ADMIN", "DESENVOLVEDOR", "GERENTE"];
/**
 * Pode ABRIR um orçamento. Inclui o design, cujo escopo de leitura é restrito
 * aos que pediram arte; criar/editar continua fechado em BUDGET_ROLES.
 */
export const BUDGET_VIEW_ROLES: Role[] = [...BUDGET_ROLES, "DESIGN"];

/** É a conta de design (e não a equipe administrativa acompanhando). */
export function isDesigner(role: Role | undefined): boolean {
  return role === "DESIGN";
}

/**
 * Contas que o gerente pode criar e gerenciar. São os papéis operacionais —
 * contas da equipe administrativa (admin/desenvolvedor/gerente) só o
 * admin/desenvolvedor mexe.
 */
export const MANAGED_BY_GERENTE_ROLES: Role[] = [...SELLER_ROLES, "DESIGN"];

/** Acesso irrestrito (admin/desenvolvedor). */
export function isFullAccess(role: Role | undefined): boolean {
  return role !== undefined && FULL_ACCESS_ROLES.includes(role);
}
/** Faz parte da equipe administrativa (admin/desenvolvedor/gerente). */
export function isStaff(role: Role | undefined): boolean {
  return role !== undefined && STAFF_ROLES.includes(role);
}

/** Pode acessar o módulo de orçamento/pedido. */
export function canUseBudgets(role: Role | undefined): boolean {
  return role !== undefined && BUDGET_ROLES.includes(role);
}

/**
 * Enxerga os orçamentos e clientes de toda a equipe. O vendedor vê só os seus;
 * admin/desenvolvedor/gerente veem tudo.
 */
export function canSeeAllBudgets(role: Role | undefined): boolean {
  return isStaff(role);
}

/** Prefixo de rota -> roles autorizadas. A primeira correspondência vence. */
export const ROUTE_ROLES: Array<{ prefix: string; roles: Role[] }> = [
  // Fila da arte. Antes de /orcamentos porque não é prefixo dele.
  { prefix: "/design", roles: DESIGN_ROLES },
  // Orçamentos/clientes são compartilhados pela equipe de venda + administração.
  // O design abre o orçamento (vê como ele é), mas as páginas de criar/editar
  // exigem BUDGET_ROLES e o barram lá dentro.
  { prefix: "/orcamentos", roles: BUDGET_VIEW_ROLES },
  { prefix: "/pedidos", roles: BUDGET_VIEW_ROLES },
  { prefix: "/clientes", roles: BUDGET_ROLES },
  { prefix: "/admin", roles: STAFF_ROLES },
  { prefix: "/vendedor", roles: ["VENDEDOR_FIXO"] },
  // O desenvolvedor usa /afiliado/saques para sacar a própria participação.
  { prefix: "/afiliado", roles: EARNER_ROLES },
];

/** Home de cada role após login. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  DESENVOLVEDOR: "/admin",
  GERENTE: "/admin",
  VENDEDOR_FIXO: "/vendedor",
  AFILIADO: "/afiliado",
  DESIGN: "/design",
};

/** Retorna as roles exigidas para uma rota protegida, ou null se for pública. */
export function requiredRolesFor(pathname: string): Role[] | null {
  const match = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix));
  return match ? match.roles : null;
}

export function canAccess(pathname: string, role: Role | undefined): boolean {
  const required = requiredRolesFor(pathname);
  if (!required) return true; // rota não-protegida por role
  return role !== undefined && required.includes(role);
}
