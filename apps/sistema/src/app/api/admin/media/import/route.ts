import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { FULL_ACCESS_ROLES } from "@/lib/rbac";
import { isValidIngestKey } from "@/server/security";
import { ehVideo, idDaMidia, MAX_IMAGEM_BYTES, tipoAceito } from "@/server/media";
import {
  casarFotosPorCodigo,
  importarLote,
  inventarioDeMidia,
  listarLinksExternos,
  salvarFotoDoTamanho,
  substituirMidia,
} from "@/server/services/media-import";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Migração das fotos para o banco. Usada pela página Admin › Imagens (sessão de
 * admin/desenvolvedor) e por automação com a chave interna de serviço — a mesma
 * do site, que nunca sai do servidor.
 *
 * GET  → números + links externos + prévia do casamento por código (só lê)
 * POST → { acao: "importar", ignorar? }, { acao: "casar-codigos" } ou
 *        { acao: "substituir", de, contentType, base64 } (troca uma foto do banco por outra)
 *        { acao: "foto-do-tamanho", produtoId, linha, tamanho, codigo?, contentType, base64 }
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
  z.object({
    acao: z.literal("foto-do-tamanho"),
    produtoId: z.string().min(1).max(100),
    linha: z.string().min(1).max(80),
    tamanho: z.string().min(1).max(60),
    codigo: z.string().max(60).optional(),
    contentType: z.string().max(100),
    base64: z.string().max(Math.ceil((MAX_IMAGEM_BYTES * 4) / 3) + 4),
  }),
  z.object({
    acao: z.literal("substituir"),
    de: z.string().max(1000),
    contentType: z.string().max(100),
    base64: z.string().max(Math.ceil((MAX_IMAGEM_BYTES * 4) / 3) + 4),
  }),
]);

/** Foto de uma medida de uma linha (site) e do item daquele código (ficha de pedido). */
async function fotoDoTamanho(dados: {
  produtoId: string;
  linha: string;
  tamanho: string;
  codigo?: string;
  contentType: string;
  base64: string;
}) {
  if (!tipoAceito(dados.contentType) || ehVideo(dados.contentType)) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await salvarFotoDoTamanho({ ...dados, bytes: Buffer.from(dados.base64, "base64") }),
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falhou." }, { status: 400 });
  }
}

/** Troca uma foto do banco por outra, em todo o cadastro. Só foto nossa e só imagem. */
async function substituir(dados: { de: string; contentType: string; base64: string }) {
  if (!idDaMidia(dados.de)) {
    return NextResponse.json({ error: "Só troca foto que já está no banco." }, { status: 400 });
  }
  if (!tipoAceito(dados.contentType) || ehVideo(dados.contentType)) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await substituirMidia(dados.de, Buffer.from(dados.base64, "base64"), dados.contentType),
    );
  } catch {
    return NextResponse.json({ error: "Não consegui ler esse arquivo." }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  await autorizar(req);

  const parsed = corpo.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const resposta =
    parsed.data.acao === "importar"
      ? NextResponse.json(await importarLote(parsed.data.limite, parsed.data.ignorar))
      : parsed.data.acao === "substituir"
        ? await substituir(parsed.data)
        : parsed.data.acao === "foto-do-tamanho"
          ? await fotoDoTamanho(parsed.data)
          : NextResponse.json(await casarFotosPorCodigo(true));

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/site");
  revalidatePath("/admin/imagens");
  return resposta;
}
