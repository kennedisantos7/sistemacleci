import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@cleci/db";

export type SessionUser = {
  id: string;
  role: Role;
  email: string;
  name?: string | null;
};

/**
 * Garante que há sessão ativa e (opcionalmente) que a role está autorizada.
 * Use em Server Components e Server Actions — o middleware já protege as rotas,
 * mas as actions precisam revalidar no servidor (defesa em profundidade).
 */
export async function requireUser(allowed?: Role[]): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.role) redirect("/login");
  if (allowed && !allowed.includes(user.role)) redirect("/");
  return { id: user.id, role: user.role, email: user.email!, name: user.name };
}
