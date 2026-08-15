import sharp from "sharp";
import { fetchImageBytes } from "@/server/media-link";

/**
 * Miniaturas dos produtos para o PDF.
 *
 * As fotos são links externos e o @react-pdf não busca URL sozinho de forma
 * confiável (sem timeout, sem limite de tamanho, e um link fora do ar derruba
 * a geração inteira). Então cada foto é baixada aqui, reduzida e embutida como
 * data URI.
 *
 * Duas regras que valem mais que a imagem:
 *   1. Falha NUNCA quebra o documento. Link morto, resposta que não é imagem,
 *      arquivo gigante — a célula sai vazia e o PDF é gerado igual.
 *   2. Cada URL é buscada uma vez só por documento, mesmo repetida em vários
 *      itens, e o resultado fica num cache curto entre gerações.
 */

/** Lado do quadrado no PDF é ~34pt; 96px cobre tela de alta densidade. */
const LADO_PX = 96;
/** Acima disso não vale a pena baixar: é foto de vitrine, não pôster. */
const MAX_BYTES = 4 * 1024 * 1024;
/** Teto por documento — protege contra pedido com dezenas de itens. */
const MAX_POR_DOCUMENTO = 40;

type Entrada = { dataUri: string | null; em: number };

const CACHE = new Map<string, Entrada>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 200;

function doCache(url: string): Entrada | null {
  const achado = CACHE.get(url);
  if (!achado) return null;
  if (Date.now() - achado.em > CACHE_TTL_MS) {
    CACHE.delete(url);
    return null;
  }
  return achado;
}

function guardar(url: string, dataUri: string | null) {
  // Descarta a entrada mais antiga quando enche — Map preserva ordem de
  // inserção, então a primeira chave é a mais velha.
  if (CACHE.size >= CACHE_MAX) {
    const maisAntiga = CACHE.keys().next().value;
    if (maisAntiga) CACHE.delete(maisAntiga);
  }
  CACHE.set(url, { dataUri, em: Date.now() });
}

async function miniatura(url: string): Promise<string | null> {
  const emCache = doCache(url);
  if (emCache) return emCache.dataUri;

  let dataUri: string | null = null;
  try {
    const bytes = await fetchImageBytes(url, MAX_BYTES);
    if (bytes) {
      // `contain` com fundo branco: a moldura no PDF é quadrada e a foto do
      // produto raramente é. Cortar (`cover`) comeria pedaço do produto.
      const png = await sharp(bytes)
        .resize(LADO_PX, LADO_PX, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png({ compressionLevel: 9 })
        .toBuffer();
      dataUri = `data:image/png;base64,${png.toString("base64")}`;
    }
  } catch {
    // Arquivo corrompido ou formato que o sharp não abre: segue sem foto.
    dataUri = null;
  }

  guardar(url, dataUri);
  return dataUri;
}

/**
 * Resolve as fotos de um documento inteiro. Recebe as URLs dos itens (com
 * repetição e nulos) e devolve url -> data URI das que deram certo.
 */
export async function carregarMiniaturas(urls: Array<string | null>): Promise<Map<string, string>> {
  const unicas = [...new Set(urls.filter((u): u is string => Boolean(u)))].slice(
    0,
    MAX_POR_DOCUMENTO,
  );
  if (unicas.length === 0) return new Map();

  const resolvidas = await Promise.all(
    unicas.map(async (url) => [url, await miniatura(url)] as const),
  );

  const mapa = new Map<string, string>();
  for (const [url, dataUri] of resolvidas) {
    if (dataUri) mapa.set(url, dataUri);
  }
  return mapa;
}
