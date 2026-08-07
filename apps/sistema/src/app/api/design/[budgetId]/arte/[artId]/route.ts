import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { BUDGET_VIEW_ROLES } from "@/lib/rbac";
import { getArtFile } from "@/server/services/design";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Entrega a imagem da arte. O arquivo mora no banco (decisão temporária), então
 * não existe URL pública: quem pede passa pela mesma checagem de acesso do
 * orçamento — vendedor dono, equipe administrativa ou o design.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ budgetId: string; artId: string }> },
) {
  const user = await requireUser(BUDGET_VIEW_ROLES);
  const { budgetId, artId } = await params;

  const art = await getArtFile(user, budgetId, artId);
  if (!art) return new NextResponse("Não encontrado", { status: 404 });

  return new NextResponse(Buffer.from(art.data), {
    headers: {
      "Content-Type": art.mimeType,
      // Privado: a imagem é de um cliente, não pode ficar em cache de CDN.
      // immutable porque cada versão da arte tem id próprio e nunca muda.
      "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    },
  });
}
