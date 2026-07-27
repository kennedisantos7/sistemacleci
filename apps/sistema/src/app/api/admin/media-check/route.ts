import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { checkMediaLink } from "@/server/media-link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Confere se um link colado no cadastro entrega mesmo imagem/vídeo.
 * Só staff — o servidor é quem busca a URL.
 */
export async function GET(req: NextRequest) {
  await requireUser(STAFF_ROLES);

  const url = req.nextUrl.searchParams.get("url") ?? "";
  if (!url) return NextResponse.json({ ok: false, reason: "Informe o link." }, { status: 400 });

  const result = await checkMediaLink(url);
  return NextResponse.json(result);
}
