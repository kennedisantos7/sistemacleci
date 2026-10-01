import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { isValidIngestKey } from "@/server/security";
import {
  casarFotosPorCodigo,
  importarLote,
  inventarioDeMidia,
  listarLinksExternos,
} from "@/server/services/media-import";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Migração das fotos para o banco. Usada pela página Admin › Imagens (sessão de
 * admin/desenvolvedor) e por automação com a chave interna de serviço — a mesma
 * do site, que nunca sai do servidor.
 *
 * GET  → números + links externos + prévia do casamento por código (só lê)
 * POST → { acao: "importar", ignorar? } ou { acao: "casar-codigos" }
 */
async function autorizar(req: NextRequest): Promise<void> {
  if (isValidIngestKey(req.headers.get("x-api-key"))) return;
  await requireUser(FULL_ACCESS_ROLES);
}

export async function GET(req: NextRequest) {
  await autorizar(req);
  const [inventario, links, previa] = await Promise.all([
    inventarioDeMidia(),
    listarLinksExternos(),
    casarFotosPorCodigo(false),
  ]);
  return NextResponse.json({
    inventario,
    linksExternos: [...links].map(([url, usos]) => ({ url, usos })),
    casamentoPorCodigo: { casados: previa.casados.length, semFoto: previa.semFoto.length, previa },
  });
}

const corpo = z.discriminatedUnion("acao", [
  z.object({
    acao: z.literal("importar"),
    ignorar: z.array(z.string().max(1000)).max(500).default([]),
    limite: z.number().int().min(1).max(20).default(6),
  }),
  z.object({ acao: z.literal("casar-codigos") }),
]);

export async function POST(req: NextRequest) {
  await autorizar(req);

  const parsed = corpo.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const resultado =
    parsed.data.acao === "importar"
      ? await importarLote(parsed.data.limite, parsed.data.ignorar)
      : await casarFotosPorCodigo(true);

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/site");
  revalidatePath("/admin/imagens");
  return NextResponse.json(resultado);
}
