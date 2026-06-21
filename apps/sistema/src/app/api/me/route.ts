import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { env } from "@/env";
import { ROLE_HOME } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Status de sessão para o site público (cleci.com.br) saber se o usuário está
 * logado no painel e trocar o botão "Entrar" por um atalho da conta.
 * CORS liberado apenas para a origem do site (env.SITE_URL) com credenciais —
 * site e painel são subdomínios do mesmo cleci.com.br (same-site), então o
 * cookie de sessão do painel é enviado normalmente.
 */
function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", env.SITE_URL);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Vary", "Origin");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "content-type");
  return withCors(res);
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.role) {
    return withCors(NextResponse.json({ loggedIn: false }));
  }

  return withCors(
    NextResponse.json({
      loggedIn: true,
      name: user.name ?? null,
      role: user.role,
      home: ROLE_HOME[user.role],
    }),
  );
}
