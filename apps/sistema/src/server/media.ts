import { createHash } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@cleci/db";
import { env } from "@/env";

/**
 * Fotos e vídeos do catálogo, guardados no banco (tabela Media).
 *
 * Quem usa a mídia guarda só o endereço `<SISTEMA_URL>/media/<id>.<ext>`, então
 * site, galeria, linhas, bordas e PDF continuam lidando com uma URL comum.
 */

const IMAGEM_CONVERTIVEL = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const EXTENSAO: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/**
 * Tipos aceitos. SVG fica de fora de propósito: é XML, pode carregar script, e
 * seria servido do domínio do painel.
 */
export function tipoAceito(contentType: string): boolean {
  return contentType in EXTENSAO;
}

export function ehVideo(contentType: string): boolean {
  return contentType.startsWith("video/");
}

/** Lado maior da foto guardada. Cobre a página do produto em tela retina. */
const LADO_MAX_PX = 1600;

export const MAX_IMAGEM_BYTES = 15 * 1024 * 1024; // foto de celular, antes de converter
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

export function limiteDoTipo(contentType: string): number {
  return ehVideo(contentType) ? MAX_VIDEO_BYTES : MAX_IMAGEM_BYTES;
}

export type ArquivoPreparado = {
  bytes: Buffer;
  contentType: string;
  width: number | null;
  height: number | null;
};

/**
 * Deixa o arquivo pronto para guardar: foto vira WebP de até 1600px (uma foto
 * de celular de 4 MB cai para ~200 KB), já girada conforme o EXIF. GIF fica
 * como veio para não perder a animação; vídeo também.
 */
export async function prepararArquivo(bytes: Buffer, contentType: string): Promise<ArquivoPreparado> {
  if (ehVideo(contentType)) return { bytes, contentType, width: null, height: null };

  if (!IMAGEM_CONVERTIVEL.has(contentType)) {
    const meta = await sharp(bytes).metadata();
    return { bytes, contentType, width: meta.width ?? null, height: meta.pageHeight ?? meta.height ?? null };
  }

  const { data, info } = await sharp(bytes)
    .rotate()
    .resize(LADO_MAX_PX, LADO_MAX_PX, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return { bytes: data, contentType: "image/webp", width: info.width, height: info.height };
}

export function urlDaMidia(id: string, contentType: string): string {
  const base = env.SISTEMA_URL.replace(/\/$/, "");
  return `${base}/media/${id}.${EXTENSAO[contentType] ?? "bin"}`;
}

const CAMINHO = /^\/media\/([a-z0-9]{20,40})\.[a-z0-9]{2,5}$/;

/**
 * Id da mídia se a URL for nossa (`/media/<id>.<ext>` no endereço do painel);
 * `null` para link externo.
 */
export function idDaMidia(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url, env.SISTEMA_URL);
    if (u.origin !== new URL(env.SISTEMA_URL).origin) return null;
    return CAMINHO.exec(u.pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function ehLinkExterno(url: string | null | undefined): boolean {
  return Boolean(url) && idDaMidia(url) === null;
}

/**
 * Grava o arquivo (já preparado) e devolve o endereço. Arquivo idêntico a um
 * existente reaproveita o registro — só acrescenta o link de origem, quando há.
 */
export async function salvarMidia(
  arquivo: ArquivoPreparado,
  origem?: string,
): Promise<{ id: string; url: string }> {
  const sha256 = createHash("sha256").update(arquivo.bytes).digest("hex");

  const existente = await prisma.media.findUnique({
    where: { sha256 },
    select: { id: true, contentType: true, sourceUrls: true },
  });
  if (existente) {
    if (origem && !existente.sourceUrls.includes(origem)) {
      await prisma.media.update({
        where: { id: existente.id },
        data: { sourceUrls: { push: origem } },
      });
    }
    return { id: existente.id, url: urlDaMidia(existente.id, existente.contentType) };
  }

  try {
    const criada = await prisma.media.create({
      data: {
        contentType: arquivo.contentType,
        bytes: arquivo.bytes,
        size: arquivo.bytes.byteLength,
        width: arquivo.width,
        height: arquivo.height,
        sha256,
        sourceUrls: origem ? [origem] : [],
      },
      select: { id: true },
    });
    return { id: criada.id, url: urlDaMidia(criada.id, arquivo.contentType) };
  } catch {
    // Corrida: o mesmo arquivo chegou por outro envio no meio do caminho.
    const outra = await prisma.media.findUnique({ where: { sha256 }, select: { id: true, contentType: true } });
    if (!outra) throw new Error("Não foi possível gravar o arquivo.");
    return { id: outra.id, url: urlDaMidia(outra.id, outra.contentType) };
  }
}

/** Envio do painel: valida, prepara e grava. Devolve o endereço. */
export async function salvarUpload(file: File): Promise<string> {
  const contentType = file.type;
  if (!tipoAceito(contentType)) {
    throw new Error("Formato inválido. Use JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM ou MOV.");
  }
  if (file.size > limiteDoTipo(contentType)) {
    throw new Error(ehVideo(contentType) ? "Vídeo muito grande (máx. 30 MB)." : "Imagem muito grande (máx. 15 MB).");
  }

  let preparado: ArquivoPreparado;
  try {
    preparado = await prepararArquivo(Buffer.from(await file.arrayBuffer()), contentType);
  } catch {
    throw new Error("Não consegui ler esse arquivo. Confira se a imagem não está corrompida.");
  }
  return (await salvarMidia(preparado)).url;
}

/** Bytes de uma mídia nossa, a partir da URL (usado pelo PDF). */
export async function bytesDaMidia(url: string): Promise<Buffer | null> {
  const id = idDaMidia(url);
  if (!id) return null;
  const media = await prisma.media.findUnique({ where: { id }, select: { bytes: true } });
  return media ? Buffer.from(media.bytes) : null;
}
