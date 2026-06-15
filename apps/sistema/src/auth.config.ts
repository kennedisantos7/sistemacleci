import type { NextAuthConfig } from "next-auth";
import type { Role, UserStatus } from "@cleci/db";
import { canAccess, ROLE_HOME } from "@/lib/rbac";

// Config compartilhada e *edge-safe* (sem Prisma/bcrypt). O middleware usa só isto.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [], // os providers concretos ficam em auth.ts (runtime Node)
  callbacks: {
    // Propaga role/status/id para o token JWT no login e em atualizações.
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.status = (user as { status: UserStatus }).status;
        token.uid = user.id;
      }
      return token;
    },
    // Expõe os campos no objeto de sessão (usado também no middleware).
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
    // Guard central de rotas (executado no middleware).
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role as Role | undefined;
      const isLoggedIn = !!auth?.user;

      // Página de login: se já logado, manda pra home da role.
      if (pathname === "/login") {
        if (isLoggedIn && role) {
          return Response.redirect(new URL(ROLE_HOME[role], request.nextUrl));
        }
        return true;
      }

      // Bloqueia rotas por role.
      if (!canAccess(pathname, role)) {
        if (!isLoggedIn) return false; // redireciona para signIn
        // Logado mas sem permissão -> manda pra própria home.
        const home = role ? ROLE_HOME[role] : "/login";
        return Response.redirect(new URL(home, request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
