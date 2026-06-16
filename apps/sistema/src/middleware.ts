import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Middleware edge-safe: usa apenas authConfig (sem Prisma/bcrypt).
// O callback `authorized` em auth.config.ts decide o acesso por role.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  // A lógica de autorização roda no callback `authorized`.
  // Aqui não precisamos fazer nada extra.
  void req;
});

export const config = {
  // Protege tudo, exceto assets, API de auth e webhooks (validados por assinatura).
  matcher: [
    "/((?!api/auth|api/webhooks|api/sales/ingest|api/health|go/|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
