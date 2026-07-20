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

/** Acesso irrestrito (admin/desenvolvedor). */
export function isFullAccess(role: Role | undefined): boolean {
  return role !== undefined && FULL_ACCESS_ROLES.includes(role);
}
/** Faz parte da equipe administrativa (admin/desenvolvedor/gerente). */
export function isStaff(role: Role | undefined): boolean {
  return role !== undefined && STAFF_ROLES.includes(role);
}

/** Prefixo de rota -> roles autorizadas. A primeira correspondência vence. */
export const ROUTE_ROLES: Array<{ prefix: string; roles: Role[] }> = [
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
