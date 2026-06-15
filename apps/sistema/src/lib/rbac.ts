import type { Role } from "@cleci/db";

/** Prefixo de rota -> roles autorizadas. A primeira correspondência vence. */
export const ROUTE_ROLES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/vendedor", roles: ["VENDEDOR_FIXO"] },
  { prefix: "/afiliado", roles: ["AFILIADO"] },
];

/** Home de cada role após login. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
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
