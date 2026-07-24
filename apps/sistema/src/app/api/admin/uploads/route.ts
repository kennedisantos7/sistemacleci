import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { uploadImage, isStorageConfigured } from "@/server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Upload de imagem de produto (admin/gerente). Devolve a URL pública. */
export async function POST(req: NextRequest) {
  await requireUser(STAFF_ROLES);

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Armazenamento de imagens não configurado no servidor." },
      { status: 503 },
    );
  }

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
    const url = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha no upload." },
      { status: 400 },
    );
  }
}
