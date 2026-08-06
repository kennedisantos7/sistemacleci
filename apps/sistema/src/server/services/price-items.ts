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
  /** Todas as unidades disponíveis, principal inclusa. */
  prices: PriceOption[];
};

const SEARCH_SELECT = {
  id: true,
  code: true,
  description: true,
  unit: true,
  priceCents: true,
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
// Administração da tabela de preços
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
    group: z.string().trim().max(80).nullable().optional(),
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
  });

export type PriceItemInput = z.infer<typeof priceItemSchema>;

/** Valor da unidade principal — espelhado em PriceItem.priceCents. */
function precoPrincipal(data: PriceItemInput): number {
  return data.prices.find((p) => p.unit === data.unit)?.priceCents ?? 0;
}

function linhasDePreco(data: PriceItemInput) {
  return data.prices.map((p, i) => ({ unit: p.unit, priceCents: p.priceCents, position: i }));
}

export function listPriceItems(options: { search?: string; includeInactive?: boolean } = {}) {
  const { search, includeInactive } = options;
  return prisma.priceItem.findMany({
    where: {
      ...(includeInactive ? {} : { active: true }),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { code: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: [{ position: "asc" }, { description: "asc" }],
    take: 500,
    include: { prices: { orderBy: [{ position: "asc" }, { unit: "asc" }] } },
  });
}

export function getPriceItem(id: string) {
  return prisma.priceItem.findUnique({
    where: { id },
    include: { prices: { orderBy: [{ position: "asc" }, { unit: "asc" }] } },
  });
}

export async function createPriceItem(data: PriceItemInput) {
  const duplicate = await prisma.priceItem.findUnique({
    where: { code: data.code },
    select: { id: true },
  });
  if (duplicate) throw new Error(`Já existe um produto com o código ${data.code}.`);

  const last = await prisma.priceItem.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const { prices, ...campos } = data;
  return prisma.priceItem.create({
    data: {
      ...campos,
      // Espelho da unidade principal — mantido junto, nunca à parte.
      priceCents: precoPrincipal(data),
      group: data.group ?? null,
      searchText: normalizeSearch(data.description),
      position: (last?.position ?? 0) + 1,
      prices: { create: linhasDePreco(data) },
    },
  });
}

export async function updatePriceItem(id: string, data: PriceItemInput) {
  const duplicate = await prisma.priceItem.findFirst({
    where: { code: data.code, NOT: { id } },
    select: { id: true },
  });
  if (duplicate) throw new Error(`Já existe um produto com o código ${data.code}.`);

  const { prices, ...campos } = data;
  // Troca o conjunto inteiro de preços numa transação: apagar e recriar evita
  // ter de casar linha a linha, e a unique (produto, unidade) impediria uma
  // atualização parcial em que duas linhas trocam de unidade entre si.
  return prisma.$transaction(async (tx) => {
    await tx.priceItemPrice.deleteMany({ where: { priceItemId: id } });
    return tx.priceItem.update({
      where: { id },
      data: {
        ...campos,
        priceCents: precoPrincipal(data),
        group: data.group ?? null,
        searchText: normalizeSearch(data.description),
        prices: { create: linhasDePreco(data) },
      },
    });
  });
}

/**
 * Desativa o produto (não apaga). Orçamentos antigos guardam o próprio snapshot
 * de código/descrição/preço, mas manter a linha preserva o vínculo do histórico.
 */
export function setPriceItemActive(id: string, active: boolean) {
  return prisma.priceItem.update({ where: { id }, data: { active } });
}
