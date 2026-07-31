import { prisma, PriceUnit, type Prisma } from "@cleci/db";
import { z } from "zod";

/** Como um produto aparece na busca do orçamento. */
export type PriceItemOption = {
  id: string;
  code: string;
  description: string;
  unit: PriceUnit;
  priceCents: number;
};

const SEARCH_SELECT = {
  id: true,
  code: true,
  description: true,
  unit: true,
  priceCents: true,
} as const;

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
    return prisma.priceItem.findMany({
      where: { active: true },
      select: SEARCH_SELECT,
      orderBy: [{ position: "asc" }, { description: "asc" }],
      take: limit,
    });
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

  return exact ? [exact, ...found] : found;
}

/** Carrega produtos por id (validação server-side do que o formulário mandou). */
export async function getPriceItemsByIds(ids: string[]): Promise<Map<string, PriceItemOption>> {
  if (ids.length === 0) return new Map();
  const items = await prisma.priceItem.findMany({
    where: { id: { in: ids } },
    select: SEARCH_SELECT,
  });
  return new Map(items.map((item) => [item.id, item]));
}

// ---------------------------------------------------------------------------
// Administração da tabela de preços
// ---------------------------------------------------------------------------

export const priceItemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Informe o código.")
    .max(32)
    .regex(/^[A-Za-z0-9._-]+$/, "Código aceita letras, números, ponto, hífen e underline."),
  description: z.string().trim().min(1, "Informe a descrição.").max(300),
  unit: z.nativeEnum(PriceUnit),
  priceCents: z.number().int().min(0).max(100_000_000),
  group: z.string().trim().max(80).nullable().optional(),
  active: z.boolean().default(true),
});

export type PriceItemInput = z.infer<typeof priceItemSchema>;

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
  });
}

export function getPriceItem(id: string) {
  return prisma.priceItem.findUnique({ where: { id } });
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
  return prisma.priceItem.create({
    data: {
      ...data,
      group: data.group ?? null,
      searchText: normalizeSearch(data.description),
      position: (last?.position ?? 0) + 1,
    },
  });
}

export async function updatePriceItem(id: string, data: PriceItemInput) {
  const duplicate = await prisma.priceItem.findFirst({
    where: { code: data.code, NOT: { id } },
    select: { id: true },
  });
  if (duplicate) throw new Error(`Já existe um produto com o código ${data.code}.`);

  return prisma.priceItem.update({
    where: { id },
    data: { ...data, group: data.group ?? null, searchText: normalizeSearch(data.description) },
  });
}

/**
 * Desativa o produto (não apaga). Orçamentos antigos guardam o próprio snapshot
 * de código/descrição/preço, mas manter a linha preserva o vínculo do histórico.
 */
export function setPriceItemActive(id: string, active: boolean) {
  return prisma.priceItem.update({ where: { id }, data: { active } });
}
