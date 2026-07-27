import { type Product } from "../components/ui/ProductCard";
import { ALL_PRODUCTS as STATIC_ALL, STATIC_CATEGORIES } from "../lib/catalog";
import {
  getAllProducts,
  getCategoryCatalog,
  getProductFromDb,
  type CategoryCatalog,
} from "./catalog-db";

/**
 * Fonte do catálogo para as páginas do site: banco primeiro, arquivos de
 * `src/data` como rede de segurança (build sem banco, banco fora do ar, ou
 * categoria ainda não migrada).
 */

/** Catálogo de uma categoria, do banco quando disponível. */
export async function loadCategory(categorySlug: string): Promise<CategoryCatalog> {
  const fromDb = await getCategoryCatalog(categorySlug);
  if (fromDb) return fromDb;

  const fallback = STATIC_CATEGORIES.find((c) => c.slug === categorySlug);
  return fallback
    ? { slugs: fallback.slugs, products: fallback.products }
    : { slugs: {}, products: [] };
}

/** Todos os produtos, do banco quando disponível. */
export async function loadAllProducts(): Promise<Product[]> {
  return (await getAllProducts()) ?? STATIC_ALL;
}

/** Produto por id, do banco quando disponível. */
export async function loadProduct(id: string): Promise<Product | undefined> {
  return (await getProductFromDb(id)) ?? STATIC_ALL.find((p) => String(p.id) === id);
}
