import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Verificação de link de mídia colado no cadastro de produto.
 *
 * O fetch parte do servidor, então a URL do usuário é tratada como hostil:
 * só http(s), sem endereço privado (evita alcançar o Postgres, o painel do
 * Coolify ou metadados da VPS) e com redirect conferido a cada salto.
 */

export type MediaKind = "image" | "video";
export type CheckResult =
  | { ok: true; kind: MediaKind; contentType: string; url: string }
  | { ok: false; reason: string; suggestion?: string };

const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

/** Faixas privadas/reservadas — nenhuma delas pode ser alvo. */
function isPrivateAddress(ip: string): boolean {
  if (ip.includes(":")) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // unique local
    if (v6.startsWith("fe80")) return true; // link-local
    // IPv4 mapeado (::ffff:10.0.0.1)
    const mapped = v6.split(":").pop();
    if (mapped && isIP(mapped) === 4) return isPrivateAddress(mapped);
    return false;
  }

  const parts = ip.split(".").map(Number);
  const a = parts[0] ?? 0;
  const b = parts[1] ?? 0;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / metadados de cloud
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("endereço interno");
    return;
  }
  const addresses = await lookup(hostname, { all: true });
  if (addresses.length === 0) throw new Error("host não resolvido");
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) throw new Error("endereço interno");
  }
}

function parseUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Link de página do Imgur (`imgur.com/AbCdEfG`) é o erro mais comum: devolve
 * HTML e a imagem aparece quebrada. O arquivo mora em `i.imgur.com/<id>.png`.
 */
export function suggestFix(url: URL): string | undefined {
  const isImgurPage =
    (url.hostname === "imgur.com" || url.hostname === "www.imgur.com") &&
    /^\/[A-Za-z0-9]{5,10}$/.test(url.pathname);
  if (isImgurPage) return `https://i.imgur.com${url.pathname}.png`;
  return undefined;
}

function kindOf(contentType: string): MediaKind | null {
  const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  return null;
}

/** Segue redirects manualmente, revalidando o host a cada salto. */
async function headWithGuard(start: URL): Promise<Response> {
  let current = start;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(current.hostname);

    let res = await fetch(current, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "cleci-media-check" },
    });

    // Alguns CDNs não respondem HEAD: tenta um GET mínimo.
    if (res.status === 403 || res.status === 405 || res.status === 501) {
      res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": "cleci-media-check", range: "bytes=0-0" },
      });
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return res;
      const next = parseUrl(new URL(location, current).toString());
      if (!next) throw new Error("redirecionamento inválido");
      current = next;
      continue;
    }

    return res;
  }

  throw new Error("redirecionamentos demais");
}

/** Confere se a URL entrega mesmo uma imagem ou vídeo. */
export async function checkMediaLink(raw: string): Promise<CheckResult> {
  const url = parseUrl(raw);
  if (!url) return { ok: false, reason: "Link inválido. Cole uma URL http(s) completa." };

  let res: Response;
  try {
    res = await headWithGuard(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha";
    if (message === "endereço interno") {
      return { ok: false, reason: "Esse endereço não é público." };
    }
    return { ok: false, reason: "Não consegui abrir o link. Confira se ele está acessível." };
  }

  if (!res.ok && res.status !== 206) {
    return { ok: false, reason: `O link respondeu ${res.status}. Confira se ele é público.` };
  }

  const contentType = res.headers.get("content-type") ?? "";
  const kind = kindOf(contentType);
  if (!kind) {
    return {
      ok: false,
      reason:
        "Esse link não é o arquivo — é uma página. Use o endereço direto da imagem ou do vídeo.",
      suggestion: suggestFix(url),
    };
  }

  return { ok: true, kind, contentType, url: url.toString() };
}
