import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/session";
import { DESIGN_ROLES } from "@/lib/rbac";
import { addArt, MAX_ARTE_BYTES } from "@/server/services/design";
import { mensagemDoErro } from "@/server/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Inteiro positivo vindo do formulário; qualquer outra coisa vira null. */
function dimensao(valor: FormDataEntryValue | null): number | null {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 && n <= 100_000 ? n : null;
}

/**
 * Upload de uma versão da arte.
 *
 * É rota, não Server Action, porque a action tem limite de 1 MB de corpo por
 * padrão no Next — arte de verdade estoura isso.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ budgetId: string }> },
) {
  const user = await requireUser(DESIGN_ROLES);
  const { budgetId } = await params;

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
  // Barra pelo tamanho antes de carregar o arquivo inteiro na memória.
  if (file.size > MAX_ARTE_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 4 MB)." }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const erro = await addArt(user, budgetId, {
      bytes,
      mimeType: file.type,
      // Medidas informadas pelo navegador: servem para exibir e avisar quando a
      // arte não é quadrada. Não valem como segurança, e nada depende delas.
      widthPx: dimensao(form.get("width")),
      heightPx: dimensao(form.get("height")),
    });
    if (erro) return NextResponse.json({ error: erro }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: mensagemDoErro(err, "Falha ao anexar a arte.") }, { status: 400 });
  }
}
