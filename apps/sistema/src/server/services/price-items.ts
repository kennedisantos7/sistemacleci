import { prisma, PriceUnit, type Prisma } from "@cleci/db";
import { z } from "zod";

/** Um preço do produto em uma unidade de venda. */
export type PriceOption = { unit: PriceUnit; priceCents: number };

/** Como um produto aparece na busca do orçamento. */
export type PriceItemOption = {
  id: string;
  code: string;
  description: string;
  /** Unidade principal — a que já vem selecionada ao escolher o produto. */
  unit: PriceUnit;
  priceCents: number;
  /** Foto, quando cadastrada: some na busca e sai no PDF. */
  imageUrl: string | null;
  /** Todas as unidades disponíveis, principal inclusa. */
  prices: PriceOption[];
};

const SEARCH_SELECT = {
  id: true,
  code: true,
  description: true,
  unit: true,
  priceCents: true,
  imageUrl: true,
  prices: {
    select: { unit: true, priceCents: true },
    orderBy: [{ position: "asc" }, { unit: "asc" }],
  },
} satisfies Prisma.PriceItemSelect;

/**
 * Produto sem nenhuma linha de preço (cadastro anterior à tabela de unidades
 * que escapou do backfill) cai no par principal, para nunca aparecer na busca
 * sem preço nenhum.
 */
function comPrecos<T extends { unit: PriceUnit; priceCents: number; prices: PriceOption[] }>(
  item: T,
): T {
  if (item.prices.length > 0) return item;
  return { ...item, prices: [{ unit: item.unit, priceCents: item.priceCents }] };
}

/**
 * Normaliza para busca: sem acento, em maiúsculas. Alimenta `searchText` na
 * gravação e é aplicada ao termo digitado — os dois lados na mesma forma.
 * Ex.: "Acréscimo" -> "ACRESCIMO".
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove os diacríticos separados pelo NFD
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Busca produtos por código ou descrição. Casa com todos os termos digitados,
 * em qualquer ordem e sem acento ("tapete gold" acha "TAPETE GOLD LISO",
 * "acrescimo" acha "ACRÉSCIMO").
 */
export async function searchPriceItems(search: string, limit = 20): Promise<PriceItemOption[]> {
  const terms = normalizeSearch(search)
    .split(" ")
    .filter(Boolean)
    .slice(0, 6); // limita o custo da query

  if (terms.length === 0) {
    const todos = await prisma.priceItem.findMany({
      where: { active: true },
      select: SEARCH_SELECT,
      orderBy: [{ position: "asc" }, { description: "asc" }],
      take: limit,
    });
    return todos.map(comPrecos);
  }

  // Código exato primeiro: digitar "2047" tem que trazer o 2047 no topo.
  const exact = /^\d+$/.test(search.trim())
    ? await prisma.priceItem.findFirst({
        where: { code: search.trim(), active: true },
        select: SEARCH_SELECT,
      })
    : null;

  // searchText já está normalizado na gravação, igual aos termos: comparação
  // direta, sem `mode: insensitive` e sem tropeçar em acento.
  const where: Prisma.PriceItemWhereInput = {
    active: true,
    AND: terms.map((term) => ({
      OR: [{ searchText: { contains: term } }, { code: { contains: term } }],
    })),
  };

  const found = await prisma.priceItem.findMany({
    where: exact ? { ...where, NOT: { id: exact.id } } : where,
    select: SEARCH_SELECT,
    orderBy: [{ position: "asc" }, { description: "asc" }],
    take: exact ? limit - 1 : limit,
  });

  return (exact ? [exact, ...found] : found).map(comPrecos);
}

/** Carrega produtos por id (validação server-side do que o formulário mandou). */
export async function getPriceItemsByIds(ids: string[]): Promise<Map<string, PriceItemOption>> {
  if (ids.length === 0) return new Map();
  const items = await prisma.priceItem.findMany({
    where: { id: { in: ids } },
    select: SEARCH_SELECT,
  });
  return new Map(items.map((item) => [item.id, comPrecos(item)]));
}

// ---------------------------------------------------------------------------
// Administração dos produtos (a seção Produtos)
// ---------------------------------------------------------------------------

export const priceItemSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Informe o código.")
      .max(32)
      .regex(/^[A-Za-z0-9._-]+$/, "Código aceita letras, números, ponto, hífen e underline."),
    description: z.string().trim().min(1, "Informe a descrição.").max(300),
    /** Unidade pré-selecionada no orçamento. Precisa estar entre os preços. */
    unit: z.nativeEnum(PriceUnit),
    prices: z
      .array(
        z.object({
          unit: z.nativeEnum(PriceUnit),
          priceCents: z.number().int().min(0).max(100_000_000),
        }),
      )
      .min(1, "Informe pelo menos um valor."),
    /** Foto do produto. URL externa — o link é conferido antes de salvar. */
    imageUrl: z
      .string()
      .trim()
      .url("A foto precisa ser um link http(s) válido.")
      .max(500)
      .nullable()
      .optional(),
    categoryId: z.string().trim().min(1).nullable().optional(),
    subcategoryId: z.string().trim().min(1).nullable().optional(),
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const unidades = data.prices.map((p) => p.unit);
    if (new Set(unidades).size !== unidades.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Há duas linhas com a mesma unidade — use uma linha por unidade.",
        path: ["prices"],
      });
    }
    if (!unidades.includes(data.unit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A unidade principal precisa ser uma das que têm valor.",
        path: ["unit"],
      });
    }
    if (data.subcategoryId && !data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escolha a categoria antes do subtipo.",
        path: ["subcategoryId"],
      });
    }
  });

export type PriceItemInput = z.infer<typeof priceItemSchema>;

/** Valor da unidade principal — espelhado em PriceItem.priceCents. */
function precoPrincipal(data: PriceItemInput): number {
  return data.prices.find((p) => p.unit === data.unit)?.priceCents ?? 0;
}

function linhasDePreco(data: PriceItemInput) {
  return data.prices.map((p, i) => ({ unit: p.unit, priceCents: p.priceCents, position: i }));
}

/** Categoria, subtipo e situação no site — o que a lista de Produtos mostra. */
const CATALOGO_INCLUDE = {
  prices: { orderBy: [{ position: "asc" }, { unit: "asc" }] },
  category: { select: { id: true, name: true } },
  subcategory: { select: { id: true, name: true } },
  siteProduct: { select: { id: true, active: true, title: true } },
} satisfies Prisma.PriceItemInclude;

export type PriceItemListFilters = {
  search?: string;
  includeInactive?: boolean;
  categoryId?: string;
  /** "no-site" só publicados; "fora" só os que não estão na vitrine. */
  site?: "no-site" | "fora";
};

export function listPriceItems(options: PriceItemListFilters = {}) {
  const { search, includeInactive, categoryId, site } = options;
  return prisma.priceItem.findMany({
    where: {
      ...(includeInactive ? {} : { active: true }),
      ...(categoryId ? { categoryId } : {}),
      ...(site === "no-site" ? { siteProductId: { not: null } } : {}),
      ...(site === "fora" ? { siteProductId: null } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { code: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: [{ description: "asc" }],
    take: 500,
    include: CATALOGO_INCLUDE,
  });
}

export function getPriceItem(id: string) {
  return prisma.priceItem.findUnique({ where: { id }, include: CATALOGO_INCLUDE });
}

/**
 * Produtos da vitrine que NÃO vieram do cadastro unificado. Sem esta lista eles
 * ficariam sem tela depois da unificação — existem desde antes, quando o
 * catálogo do site era cadastrado à parte, e muitos não têm código.
 */
export function listUnlinkedSiteProducts(search?: string) {
  return prisma.product.findMany({
    where: {
      priceItem: null,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: [{ active: "desc" }, { position: "asc" }],
    take: 200,
    include: { category: { select: { name: true } }, subcategory: { select: { name: true } } },
  });
}

/**
 * Subtipo tem de pertencer à categoria escolhida. É checado contra o banco
 * porque o formulário manda ids e ninguém confia em `<select>` do navegador.
 */
async function validarCategoria(data: PriceItemInput) {
  if (!data.categoryId) return;
  const categoria = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });
  if (!categoria) throw new Error("Categoria inválida.");
  if (!data.subcategoryId) return;
  const sub = await prisma.subcategory.findFirst({
    where: { id: data.subcategoryId, categoryId: data.categoryId },
    select: { id: true },
  });
  if (!sub) throw new Error("O subtipo escolhido não é dessa categoria.");
}

/**
 * Outro produto já usa este código? A comparação IGNORA maiúsculas/minúsculas:
 * a unique do banco é sensível a caixa, então "TAP-01" e "tap-01" entrariam
 * como dois produtos — e para quem lê a tabela, ou busca no orçamento, é o
 * mesmo código. Inclui inativos de propósito: código de produto desativado
 * continua preso ao histórico dos orçamentos antigos.
 */
async function codigoEmUso(code: string, exceptId?: string) {
  return prisma.priceItem.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { code: true, description: true, active: true },
  });
}

/**
 * Mensagem do código repetido. A descrição entra cortada porque `mensagemDoErro`
 * descarta texto acima de 200 caracteres como erro interno — e descrição de
 * produto vai até 300.
 */
function erroCodigoEmUso(existente: { code: string; description: string; active: boolean }): Error {
  const nome = existente.description.slice(0, 60);
  return new Error(
    `O código ${existente.code} já é do produto "${nome}"${existente.active ? "" : " (desativado)"}. Use outro código.`,
  );
}

/** A unique do banco estourou no código (corrida entre dois cadastros). */
function ehCodigoDuplicado(err: unknown): boolean {
  const e = err as Prisma.PrismaClientKnownRequestError;
  return (
    e?.code === "P2002" && (e.meta?.target as string[] | undefined)?.includes("code") === true
  );
}

export async function createPriceItem(data: PriceItemInput) {
  const emUso = await codigoEmUso(data.code);
  if (emUso) throw erroCodigoEmUso(emUso);
  await validarCategoria(data);

  const last = await prisma.priceItem.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const { prices, ...campos } = data;
  try {
    return await prisma.priceItem.create({
      data: {
        ...campos,
        // Espelho da unidade principal — mantido junto, nunca à parte.
        priceCents: precoPrincipal(data),
        imageUrl: data.imageUrl ?? null,
        categoryId: data.categoryId ?? null,
        subcategoryId: data.subcategoryId ?? null,
        searchText: normalizeSearch(data.description),
        position: (last?.position ?? 0) + 1,
        prices: { create: linhasDePreco(data) },
      },
    });
  } catch (err) {
    // Consultar e depois inserir não é atômico: dois cadastros simultâneos com
    // o mesmo código passam os dois pela checagem. Quem perde a corrida recebe
    // a mesma frase, e não um erro genérico do Prisma.
    if (ehCodigoDuplicado(err)) {
      throw new Error(`Já existe um produto com o código ${data.code}.`);
    }
    throw err;
  }
}

export async function updatePriceItem(id: string, data: PriceItemInput) {
  const emUso = await codigoEmUso(data.code, id);
  if (emUso) throw erroCodigoEmUso(emUso);
  await validarCategoria(data);

  const { prices, ...campos } = data;
  // Troca o conjunto inteiro de preços numa transação: apagar e recriar evita
  // ter de casar linha a linha, e a unique (produto, unidade) impediria uma
  // atualização parcial em que duas linhas trocam de unidade entre si.
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.priceItemPrice.deleteMany({ where: { priceItemId: id } });
      return tx.priceItem.update({
        where: { id },
        data: {
          // `group` fica de fora de propósito: o formulário não o edita mais
          // (quem classifica é categoryId), e gravar null aqui apagaria a
          // classificação que veio da planilha em quem nunca foi casado com o
          // catálogo. Sem a chave, o Prisma não toca na coluna.
          ...campos,
          priceCents: precoPrincipal(data),
          imageUrl: data.imageUrl ?? null,
          categoryId: data.categoryId ?? null,
          subcategoryId: data.subcategoryId ?? null,
          searchText: normalizeSearch(data.description),
          prices: { create: linhasDePreco(data) },
        },
      });
    });
  } catch (err) {
    if (ehCodigoDuplicado(err)) {
      throw new Error(`Já existe um produto com o código ${data.code}.`);
    }
    throw err;
  }
}

/**
 * Desativa o produto (não apaga). Orçamentos antigos guardam o próprio snapshot
 * de código/descrição/preço, mas manter a linha preserva o vínculo do histórico.
 */
export function setPriceItemActive(id: string, active: boolean) {
  return prisma.priceItem.update({ where: { id }, data: { active } });
}
