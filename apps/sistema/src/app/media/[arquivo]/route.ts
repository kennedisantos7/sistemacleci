import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { prisma } from "@cleci/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Entrega pública das fotos e vídeos do catálogo (tabela Media).
 *
 * Pública por natureza — é a vitrine do site. Só lê por id, e só serve os
 * tipos que o envio aceita (imagem e vídeo; SVG nunca entra).
 *
 * O conteúdo de um id nunca muda (trocar a foto gera outro id), então o cache
 * é de um ano. Vídeo responde por pedaços (Range): o Safari não toca sem isso.
 */

const UM_ANO = "public, max-age=31536000, immutable";

type Meta = { id: string; contentType: string; size: number; sha256: string };

async function carregarMeta(arquivo: string): Promise<Meta | null> {
  const id = /^([a-z0-9]{20,40})\.[a-z0-9]{2,5}$/.exec(arquivo)?.[1];
  if (!id) return null;
  return prisma.media.findUnique({
    where: { id },
    select: { id: true, contentType: true, size: true, sha256: true },
  });
}

function cabecalhos(meta: Meta): Record<string, string> {
  return {
    "Content-Type": meta.contentType,
    "Cache-Control": UM_ANO,
    ETag: `"${meta.sha256}"`,
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    // Site e painel são origens diferentes; a foto aparece nos dois.
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
}

/** "bytes=0-1023" → { inicio: 0, fim: 1023 }; `null` se ausente ou inválido. */
function lerRange(header: string | null, total: number): { inicio: number; fim: number } | null {
  const m = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  if (!m || (m[1] === "" && m[2] === "")) return null;

  let inicio: number;
  let fim: number;
  if (m[1] === "") {
    // "bytes=-500": os últimos 500 bytes.
    inicio = Math.max(0, total - Number(m[2]));
    fim = total - 1;
  } else {
    inicio = Number(m[1]);
    fim = m[2] === "" ? total - 1 : Math.min(Number(m[2]), total - 1);
  }
  if (inicio > fim || inicio >= total) return null;
  return { inicio, fim };
}

export async function HEAD(_req: NextRequest, ctx: { params: Promise<{ arquivo: string }> }) {
  const meta = await carregarMeta((await ctx.params).arquivo);
  if (!meta) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, {
    headers: { ...cabecalhos(meta), "Content-Length": String(meta.size) },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ arquivo: string }> }) {
  const meta = await carregarMeta((await ctx.params).arquivo);
  if (!meta) return new NextResponse("Arquivo não encontrado.", { status: 404 });

  const base = cabecalhos(meta);
  if (req.headers.get("if-none-match") === base.ETag) {
    return new NextResponse(null, { status: 304, headers: base });
  }

  const header = req.headers.get("range");
  const range = lerRange(header, meta.size);

  if (header && !range) {
    return new NextResponse(null, {
      status: 416,
      headers: { ...base, "Content-Range": `bytes */${meta.size}` },
    });
  }

  if (range) {
    const tamanho = range.fim - range.inicio + 1;
    // substring em bytea é 1-based. Com STORAGE EXTERNAL o Postgres lê só o
    // trecho pedido, sem carregar o vídeo inteiro.
    const linhas = await prisma.$queryRaw<Array<{ trecho: Uint8Array }>>`
      SELECT substring("bytes" FROM ${range.inicio + 1}::int FOR ${tamanho}::int) AS trecho
      FROM "Media" WHERE "id" = ${meta.id}`;
    const trecho = linhas[0]?.trecho;
    if (!trecho) return new NextResponse(null, { status: 404 });
    return new NextResponse(Buffer.from(trecho), {
      status: 206,
      headers: {
        ...base,
        "Content-Length": String(tamanho),
        "Content-Range": `bytes ${range.inicio}-${range.fim}/${meta.size}`,
      },
    });
  }

  // Miniatura (?w=160): listas, menu e busca do orçamento não precisam da foto
  // de 1600px. Só larguras fixas, para ninguém pedir 10.000 variações.
  const largura = Number(req.nextUrl.searchParams.get("w"));
  if (LARGURAS.has(largura) && REDIMENSIONAVEL.has(meta.contentType)) {
    const chave = `${meta.id}:${largura}`;
    let reduzida = MINIATURAS.get(chave);
    if (!reduzida) {
      const original = await prisma.media.findUnique({ where: { id: meta.id }, select: { bytes: true } });
      if (!original) return new NextResponse(null, { status: 404 });
      reduzida = await sharp(Buffer.from(original.bytes))
        .resize(largura, largura, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
      guardarMiniatura(chave, reduzida);
    }
    return new NextResponse(reduzida, {
      headers: {
        ...base,
        "Content-Type": "image/webp",
        "Content-Length": String(reduzida.byteLength),
        ETag: `"${meta.sha256}-w${largura}"`,
        "Accept-Ranges": "none",
      },
    });
  }

  const media = await prisma.media.findUnique({ where: { id: meta.id }, select: { bytes: true } });
  if (!media) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(media.bytes), {
    headers: { ...base, "Content-Length": String(meta.size) },
  });
}

const LARGURAS = new Set([96, 160, 320, 640]);
const REDIMENSIONAVEL = new Set(["image/webp", "image/jpeg", "image/png", "image/avif"]);

// Sem CDN na frente, cada visitante novo pediria a mesma miniatura e o servidor
// redimensionaria de novo. Uma miniatura tem de 3 a 40 KB: 400 cabem em ~10 MB.
const MINIATURAS = new Map<string, Buffer>();
const MAX_MINIATURAS = 400;

function guardarMiniatura(chave: string, bytes: Buffer) {
  if (MINIATURAS.size >= MAX_MINIATURAS) {
    const maisAntiga = MINIATURAS.keys().next().value;
    if (maisAntiga) MINIATURAS.delete(maisAntiga);
  }
  MINIATURAS.set(chave, bytes);
}
