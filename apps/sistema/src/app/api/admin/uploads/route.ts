import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { salvarUpload } from "@/server/media";
import { mensagemDoErro } from "@/server/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Envio de foto ou vídeo de produto. Grava no banco e devolve o endereço.
 * Mesmo grupo que edita Produtos: quem não altera o cadastro não sobe arquivo.
 */
export async function POST(req: NextRequest) {
  await requireUser(FULL_ACCESS_ROLES);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  try {
    return NextResponse.json({ url: await salvarUpload(file) });
  } catch (err) {
    return NextResponse.json({ error: mensagemDoErro(err, "Falha no envio.") }, { status: 400 });
  }
}
