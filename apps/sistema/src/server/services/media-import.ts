import { prisma, type Prisma } from "@cleci/db";
import { fetchMediaBytes, suggestFix } from "@/server/media-link";
import {
  ehLinkExterno,
  MAX_VIDEO_BYTES,
  prepararArquivo,
  salvarMidia,
  tipoAceito,
} from "@/server/media";

/**
 * Traz para o banco as fotos e vídeos que ainda são links externos (imgur) e
 * troca as referências pelo endereço novo. O link original fica gravado na
 * mídia (`sourceUrls`), então a troca pode ser desfeita.
 *
 * Onde há foto no cadastro:
 *  - Product: imageUrl, gallery[], variants[].image, borders[].image
 *  - PriceItem: imageUrl (a foto da ficha de pedido)
 */

type Linha = { image?: unknown; codes?: unknown; name?: unknown };

function lista(json: Prisma.JsonValue | null): Linha[] {
  return Array.isArray(json) ? (json.filter((x) => x && typeof x === "object") as Linha[]) : [];
}

function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Link externo → onde ele é usado (para o relatório). */
export async function listarLinksExternos(): Promise<Map<string, string[]>> {
  const [produtos, itens] = await Promise.all([
    prisma.product.findMany({
      select: { title: true, imageUrl: true, gallery: true, variants: true, borders: true },
    }),
    prisma.priceItem.findMany({
      where: { imageUrl: { not: null } },
      select: { code: true, imageUrl: true },
    }),
  ]);

  const usos = new Map<string, string[]>();
  const anotar = (url: string | null, onde: string) => {
    if (!url || !ehLinkExterno(url)) return;
    usos.set(url, [...(usos.get(url) ?? []), onde]);
  };

  for (const p of produtos) {
    anotar(p.imageUrl, `${p.title} — foto principal`);
    p.gallery.forEach((u) => anotar(u, `${p.title} — galeria`));
    for (const v of lista(p.variants)) anotar(texto(v.image), `${p.title} — linha ${texto(v.name) ?? "?"}`);
    for (const b of lista(p.borders)) anotar(texto(b.image), `${p.title} — borda ${texto(b.name) ?? "?"}`);
  }
  for (const i of itens) anotar(i.imageUrl, `Tabela de preços — código ${i.code}`);

  return usos;
}

export type ResultadoLote = {
  importados: Array<{ de: string; para: string }>;
  falhas: Array<{ url: string; motivo: string }>;
  restantes: number;
};

/** Baixa e grava um link. Devolve o endereço novo, ou o motivo da falha. */
async function importarUm(url: string): Promise<{ ok: true; para: string } | { ok: false; motivo: string }> {
  // Link de PÁGINA do imgur devolve HTML; o arquivo mora em i.imgur.com.
  let alvo = url;
  try {
    alvo = suggestFix(new URL(url)) ?? url;
  } catch {
    return { ok: false, motivo: "link inválido" };
  }

  const baixado = await fetchMediaBytes(alvo, MAX_VIDEO_BYTES, ["image", "video"], 30_000);
  if (!baixado) return { ok: false, motivo: "não abriu, não é imagem/vídeo ou passa de 30 MB" };
  if (!tipoAceito(baixado.contentType)) {
    return { ok: false, motivo: `formato não aceito (${baixado.contentType})` };
  }

  try {
    const preparado = await prepararArquivo(baixado.bytes, baixado.contentType);
    const { url: para } = await salvarMidia(preparado, url);
    return { ok: true, para };
  } catch {
    return { ok: false, motivo: "arquivo corrompido ou ilegível" };
  }
}

/**
 * Importa até `limite` links por chamada — o painel chama de novo até acabar,
 * mostrando o progresso. `ignorar` são os que já falharam nesta rodada, para
 * um link morto não travar a fila.
 */
export async function importarLote(limite = 6, ignorar: string[] = []): Promise<ResultadoLote> {
  const pular = new Set(ignorar);
  const pendentes = [...(await listarLinksExternos()).keys()].filter((u) => !pular.has(u)).sort();
  const lote = pendentes.slice(0, limite);

  const importados: ResultadoLote["importados"] = [];
  const falhas: ResultadoLote["falhas"] = [];
  for (const url of lote) {
    const r = await importarUm(url);
    if (r.ok) importados.push({ de: url, para: r.para });
    else falhas.push({ url, motivo: r.motivo });
  }

  await substituirReferencias(new Map(importados.map((i) => [i.de, i.para])));
  return { importados, falhas, restantes: pendentes.length - lote.length };
}

/**
 * Troca uma foto já guardada por uma versão nova (ex.: foto refeita) em todo o
 * cadastro: vitrine, galeria, linhas, bordas e a foto da ficha de pedido. A
 * mídia antiga fica no banco, então a troca pode ser desfeita.
 */
export async function substituirMidia(
  de: string,
  bytes: Buffer,
  contentType: string,
): Promise<{ para: string; produtos: number; itens: number }> {
  const preparado = await prepararArquivo(bytes, contentType);
  const { url: para } = await salvarMidia(preparado, de);
  const trocas = await substituirReferencias(new Map([[de, para]]));
  return { para, ...trocas };
}

/**
 * Foto de uma medida de uma linha: vai para a linha do produto (o site mostra ao
 * escolher a medida) e, havendo código, para o item da tabela de preços (ficha de
 * pedido e orçamento). Linha sem código (ex.: papel Plastificada) fica só no site.
 */
export async function salvarFotoDoTamanho(dados: {
  produtoId: string;
  linha: string;
  tamanho: string;
  codigo?: string;
  bytes: Buffer;
  contentType: string;
}): Promise<{ url: string; linha: boolean; itens: number }> {
  const produto = await prisma.product.findUnique({
    where: { id: dados.produtoId },
    select: { id: true, variants: true },
  });
  if (!produto) throw new Error("Produto não encontrado.");

  const linhas = lista(produto.variants) as Array<Record<string, unknown>>;
  const alvo = linhas.findIndex((v) => texto(v.name) === dados.linha);
  const medidas = alvo >= 0 && Array.isArray(linhas[alvo]!.sizes) ? (linhas[alvo]!.sizes as unknown[]) : [];
  if (!medidas.includes(dados.tamanho)) throw new Error("Linha ou medida não existe nesse produto.");

  const preparado = await prepararArquivo(dados.bytes, dados.contentType);
  const { url } = await salvarMidia(preparado);

  const atual = linhas[alvo]!.sizeImages;
  const sizeImages = atual && typeof atual === "object" && !Array.isArray(atual) ? { ...(atual as object) } : {};
  linhas[alvo] = { ...linhas[alvo], sizeImages: { ...sizeImages, [dados.tamanho]: url } };
  await prisma.product.update({
    where: { id: produto.id },
    data: { variants: linhas as Prisma.InputJsonValue },
  });

  const itens = dados.codigo
    ? (await prisma.priceItem.updateMany({ where: { code: dados.codigo }, data: { imageUrl: url } })).count
    : 0;
  return { url, linha: true, itens };
}

/** Troca, em todo o cadastro, cada link antigo pelo endereço novo. */
export async function substituirReferencias(
  mapa: Map<string, string>,
): Promise<{ produtos: number; itens: number }> {
  if (mapa.size === 0) return { produtos: 0, itens: 0 };
  let produtosAlterados = 0;
  let itensAlterados = 0;
  const trocar = (u: string | null) => (u && mapa.get(u)) || u;
  const trocarLista = (json: Prisma.JsonValue | null) =>
    lista(json).map((item) => {
      const image = texto(item.image);
      let novo: Linha & { sizeImages?: unknown } =
        image && mapa.has(image) ? { ...item, image: mapa.get(image) } : item;
      const porMedida = (item as { sizeImages?: unknown }).sizeImages;
      if (porMedida && typeof porMedida === "object" && !Array.isArray(porMedida)) {
        const trocadas = Object.fromEntries(
          Object.entries(porMedida).map(([m, u]) => [m, typeof u === "string" ? (mapa.get(u) ?? u) : u]),
        );
        if (JSON.stringify(trocadas) !== JSON.stringify(porMedida)) novo = { ...novo, sizeImages: trocadas };
      }
      return novo;
    });

  const produtos = await prisma.product.findMany({
    select: { id: true, imageUrl: true, gallery: true, variants: true, borders: true },
  });
  for (const p of produtos) {
    const imageUrl = trocar(p.imageUrl)!;
    const gallery = p.gallery.map((u) => trocar(u)!);
    const variants = trocarLista(p.variants);
    const borders = trocarLista(p.borders);

    const mudou =
      imageUrl !== p.imageUrl ||
      gallery.some((u, i) => u !== p.gallery[i]) ||
      JSON.stringify(variants) !== JSON.stringify(lista(p.variants)) ||
      JSON.stringify(borders) !== JSON.stringify(lista(p.borders));
    if (!mudou) continue;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        imageUrl,
        gallery,
        // Coluna nula continua nula: não inventa lista vazia onde não havia.
        ...(p.variants !== null ? { variants: variants as Prisma.InputJsonValue } : {}),
        ...(p.borders !== null ? { borders: borders as Prisma.InputJsonValue } : {}),
      },
    });
    produtosAlterados++;
  }

  for (const [de, para] of mapa) {
    const { count } = await prisma.priceItem.updateMany({ where: { imageUrl: de }, data: { imageUrl: para } });
    itensAlterados += count;
  }
  return { produtos: produtosAlterados, itens: itensAlterados };
}

// ---------------------------------------------------------------------------
// Foto da ficha de pedido: casar o item da tabela com o catálogo pelo código
// ---------------------------------------------------------------------------

export type Casamento = {
  priceItemId: string;
  code: string;
  description: string;
  foto: string;
  origem: string;
};

const normalizar = (code: string) => code.trim().toUpperCase();

/**
 * Para cada item da tabela SEM foto, procura a foto certa no catálogo do site:
 *  1. a vitrine publicada a partir do próprio item;
 *  2. a linha do produto cujo código é o do item (foto da linha, ou a do
 *     produto quando a linha não tem foto própria);
 *  3. a borda com esse código;
 *  4. o produto cujo código (principal ou por tamanho) é o do item.
 * Sem correspondência, o item fica sem foto — não se chuta.
 */
export async function casarFotosPorCodigo(
  aplicar: boolean,
): Promise<{ casados: Casamento[]; semFoto: Array<{ code: string; description: string }> }> {
  const [itens, produtos] = await Promise.all([
    prisma.priceItem.findMany({
      where: { OR: [{ imageUrl: null }, { imageUrl: "" }] },
      select: { id: true, code: true, description: true, siteProductId: true },
      orderBy: { code: "asc" },
    }),
    // Ativos primeiro: produto desativado na consolidação só entra se o código
    // não existir em nenhum ativo.
    prisma.product.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true,
        code: true,
        codes: true,
        variants: true,
        borders: true,
        active: true,
      },
      orderBy: [{ active: "desc" }, { position: "asc" }],
    }),
  ]);

  const porCodigo = new Map<string, { foto: string; origem: string }>();
  const registrar = (code: unknown, foto: string | null, origem: string) => {
    const c = texto(code);
    if (!c || !foto) return;
    const chave = normalizar(c);
    if (!porCodigo.has(chave)) porCodigo.set(chave, { foto, origem });
  };

  for (const p of produtos) {
    for (const v of lista(p.variants)) {
      const fotoDaLinha = texto(v.image);
      const codes = Array.isArray(v.codes) ? v.codes : [];
      for (const c of codes) {
        registrar(
          c,
          fotoDaLinha ?? texto(p.imageUrl),
          fotoDaLinha ? `${p.title} — linha ${texto(v.name) ?? "?"}` : `${p.title} (foto do produto)`,
        );
      }
    }
  }
  for (const p of produtos) {
    for (const b of lista(p.borders)) {
      registrar((b as { code?: unknown }).code, texto(b.image), `${p.title} — borda ${texto(b.name) ?? "?"}`);
    }
  }
  for (const p of produtos) {
    registrar(p.code, texto(p.imageUrl), p.title);
    p.codes.forEach((c) => registrar(c, texto(p.imageUrl), p.title));
  }

  const vitrine = new Map(produtos.map((p) => [p.id, p]));
  const casados: Casamento[] = [];
  const semFoto: Array<{ code: string; description: string }> = [];

  for (const item of itens) {
    const propria = item.siteProductId ? vitrine.get(item.siteProductId) : undefined;
    const achado =
      propria && texto(propria.imageUrl)
        ? { foto: propria.imageUrl, origem: `${propria.title} (vitrine deste item)` }
        : porCodigo.get(normalizar(item.code));

    if (achado) {
      casados.push({ priceItemId: item.id, code: item.code, description: item.description, ...achado });
    } else {
      semFoto.push({ code: item.code, description: item.description });
    }
  }

  if (aplicar) {
    for (const c of casados) {
      // Condição repetida no WHERE: se alguém pôs foto no meio do caminho, ela vale.
      await prisma.priceItem.updateMany({
        where: { id: c.priceItemId, OR: [{ imageUrl: null }, { imageUrl: "" }] },
        data: { imageUrl: c.foto },
      });
    }
  }

  return { casados, semFoto };
}

// ---------------------------------------------------------------------------
// Página Imagens: organização por categoria e números
// ---------------------------------------------------------------------------

export type ProdutoDaVitrine = {
  id: string;
  title: string;
  capa: string;
  fotos: number;
  linhas: number;
  externas: number;
};

export type ItemDaTabela = { id: string; code: string; description: string; imageUrl: string | null };

/** Categoria → vitrines do site e itens da tabela de preços, com as fotos de cada um. */
export async function organizacaoPorCategoria() {
  const selecaoItem = { id: true, code: true, description: true, imageUrl: true } as const;
  const [categorias, semCategoria] = await Promise.all([
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: {
        id: true,
        name: true,
        products: {
          where: { active: true },
          orderBy: { position: "asc" },
          select: { id: true, title: true, imageUrl: true, gallery: true, variants: true, borders: true },
        },
        priceItems: { where: { active: true }, orderBy: { code: "asc" }, select: selecaoItem },
      },
    }),
    prisma.priceItem.findMany({
      where: { active: true, categoryId: null },
      orderBy: { code: "asc" },
      select: selecaoItem,
    }),
  ]);

  const resumir = (p: (typeof categorias)[number]["products"][number]): ProdutoDaVitrine => {
    const todas = new Set(
      [
        p.imageUrl,
        ...p.gallery,
        ...lista(p.variants).map((v) => texto(v.image)),
        ...lista(p.borders).map((b) => texto(b.image)),
      ].filter((u): u is string => Boolean(u)),
    );
    return {
      id: p.id,
      title: p.title,
      capa: p.imageUrl,
      fotos: todas.size,
      linhas: lista(p.variants).length,
      externas: [...todas].filter((u) => ehLinkExterno(u)).length,
    };
  };

  return {
    categorias: categorias.map((c) => ({
      id: c.id,
      name: c.name,
      produtos: c.products.map(resumir),
      itens: c.priceItems as ItemDaTabela[],
    })),
    semCategoria: semCategoria as ItemDaTabela[],
  };
}

export async function inventarioDeMidia() {
  const [arquivos, links, itensTotal, itensSemFoto] = await Promise.all([
    prisma.media.aggregate({ _count: { _all: true }, _sum: { size: true } }),
    listarLinksExternos(),
    prisma.priceItem.count(),
    prisma.priceItem.count({ where: { OR: [{ imageUrl: null }, { imageUrl: "" }] } }),
  ]);
  return {
    arquivosNoBanco: arquivos._count._all,
    bytesNoBanco: arquivos._sum.size ?? 0,
    linksExternos: links.size,
    itensTabela: itensTotal,
    itensSemFoto,
  };
}
