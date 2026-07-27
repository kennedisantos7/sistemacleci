import { prisma } from "@cleci/db";
import {
  type BorderOption,
  type Product,
  type ProductVariant,
} from "../components/ui/ProductCard";

/**
 * Leitura do catálogo no banco (fonte de verdade, alimentada pelo painel).
 *
 * Toda função aqui é tolerante a falha: se o banco estiver fora, sem
 * DATABASE_URL (caso do build no Docker) ou ainda sem os dados da categoria,
 * devolve `null` e quem chama usa os arquivos estáticos de `src/data` como
 * fallback — o site nunca fica vazio por causa do banco.
 */

export type CategoryCatalog = {
  /** slug do subtipo -> rótulo, na ordem do painel. */
  slugs: Record<string, string>;
  products: Product[];
};

type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number | null;
  imageUrl: string;
  gallery: string[];
  sizes: string[];
  codes: string[];
  borders: unknown;
  variants: unknown;
  badge: string | null;
  badgeColor: string | null;
  code: string | null;
  subcategory: { name: string } | null;
  category: { name: string; path: string };
};

function toBorders(raw: unknown): BorderOption[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const list = raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const v = item as Record<string, unknown>;
    if (typeof v.name !== "string" || typeof v.image !== "string") return [];
    return [{ name: v.name, image: v.image, code: String(v.code ?? "") }];
  });
  return list.length > 0 ? list : undefined;
}

function toVariants(raw: unknown): ProductVariant[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const list = raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const v = item as Record<string, unknown>;
    if (typeof v.name !== "string" || !v.name) return [];
    const strings = (value: unknown) =>
      Array.isArray(value) ? value.filter((s): s is string => typeof s === "string") : undefined;
    return [
      {
        name: v.name,
        image: typeof v.image === "string" && v.image ? v.image : undefined,
        description:
          typeof v.description === "string" && v.description ? v.description : undefined,
        sizes: strings(v.sizes),
        codes: strings(v.codes),
      },
    ];
  });
  return list.length > 0 ? list : undefined;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    // O rótulo do subtipo é o que o site usa como "categoria" nos filtros.
    category: row.subcategory?.name ?? row.category.name,
    categoryPath: row.category.path,
    image: row.imageUrl,
    images: row.gallery.length > 0 ? row.gallery : undefined,
    description: row.description ?? undefined,
    priceCents: row.priceCents ?? undefined,
    sizes: row.sizes.length > 0 ? row.sizes : undefined,
    codes: row.codes.length > 0 ? row.codes : undefined,
    borders: toBorders(row.borders),
    variants: toVariants(row.variants),
    badge: row.badge,
    badgeColor: row.badgeColor ?? undefined,
    code: row.code ?? undefined,
  };
}

const PRODUCT_SELECT = {
  id: true,
  title: true,
  description: true,
  priceCents: true,
  imageUrl: true,
  gallery: true,
  sizes: true,
  codes: true,
  borders: true,
  variants: true,
  badge: true,
  badgeColor: true,
  code: true,
  subcategory: { select: { name: true } },
  category: { select: { name: true, path: true } },
} as const;

/** Catálogo de uma categoria (ex.: "sacolas"); `null` se indisponível/vazia. */
export async function getCategoryCatalog(categorySlug: string): Promise<CategoryCatalog | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: {
        subcategories: { orderBy: { position: "asc" }, select: { slug: true, name: true } },
        products: {
          where: { active: true },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          select: PRODUCT_SELECT,
        },
      },
    });
    if (!category || category.products.length === 0) return null;

    return {
      slugs: Object.fromEntries(category.subcategories.map((s) => [s.slug, s.name])),
      products: category.products.map(toProduct),
    };
  } catch {
    return null;
  }
}

/** Todos os produtos ativos (páginas de busca e home); `null` se indisponível. */
export async function getAllProducts(): Promise<Product[] | null> {
  try {
    const rows = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ categoryId: "asc" }, { position: "asc" }],
      select: PRODUCT_SELECT,
    });
    return rows.length > 0 ? rows.map(toProduct) : null;
  } catch {
    return null;
  }
}

/**
 * Produto por id; `null` se indisponível ou inexistente.
 *
 * Links antigos usam o id curto do catálogo estático (ex.: `s-06`), enquanto o
 * banco guarda o id do seed (`seed_sacolas_s-06`). Se a busca exata não achar,
 * tentamos o sufixo para não quebrar link compartilhado ou de afiliado.
 */
export async function getProductFromDb(id: string): Promise<Product | null> {
  try {
    const row =
      (await prisma.product.findFirst({
        where: { id, active: true },
        select: PRODUCT_SELECT,
      })) ??
      (await prisma.product.findFirst({
        where: { id: { endsWith: `_${id}` }, active: true },
        select: PRODUCT_SELECT,
      }));
    return row ? toProduct(row) : null;
  } catch {
    return null;
  }
}
