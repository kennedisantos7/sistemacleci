import type { Product } from "../components/ui/ProductCard";
import { TAPETES_CATALOG, TAPETES_SLUGS } from "../data/tapetes";
import { GRAFICA_CATALOG, GRAFICA_SLUGS } from "../data/grafica";
import { SACOLAS_CATALOG, SACOLAS_SLUGS } from "../data/sacolas";
import { PLAYGROUND_CATALOG, PLAYGROUND_SLUGS } from "../data/playground";
import { MESAS_FREEZERS_CATALOG, MESAS_FREEZERS_SLUGS } from "../data/mesas-freezers";
import { SEGURANCA_CATALOG, SEGURANCA_SLUGS } from "../data/seguranca";
import { COMUNICACAO_VISUAL_CATALOG, COMUNICACAO_VISUAL_SLUGS } from "../data/comunicacao-visual";

/**
 * Catálogo estático — hoje serve de fallback para quando o banco (fonte de
 * verdade, alimentada pelo painel) não estiver disponível.
 */

export type StaticCategory = {
  slug: string;
  path: string;
  slugs: Record<string, string>;
  products: Product[];
};

function tag(path: string, products: Product[]): Product[] {
  return products.map((p) => ({ ...p, categoryPath: path }));
}

export const STATIC_CATEGORIES: StaticCategory[] = [
  { slug: "tapetes", path: "/tapetes", slugs: TAPETES_SLUGS, products: tag("/tapetes", TAPETES_CATALOG) },
  { slug: "grafica", path: "/grafica", slugs: GRAFICA_SLUGS, products: tag("/grafica", GRAFICA_CATALOG) },
  { slug: "sacolas", path: "/sacolas", slugs: SACOLAS_SLUGS, products: tag("/sacolas", SACOLAS_CATALOG) },
  {
    slug: "playground",
    path: "/playground",
    slugs: PLAYGROUND_SLUGS,
    products: tag("/playground", PLAYGROUND_CATALOG),
  },
  {
    slug: "mesas-e-freezers",
    path: "/mesas-e-freezers",
    slugs: MESAS_FREEZERS_SLUGS,
    products: tag("/mesas-e-freezers", MESAS_FREEZERS_CATALOG),
  },
  {
    slug: "seguranca",
    path: "/seguranca",
    slugs: SEGURANCA_SLUGS,
    products: tag("/seguranca", SEGURANCA_CATALOG),
  },
  {
    slug: "comunicacao-visual",
    path: "/comunicacao-visual",
    slugs: COMUNICACAO_VISUAL_SLUGS,
    products: tag("/comunicacao-visual", COMUNICACAO_VISUAL_CATALOG),
  },
];

export const ALL_PRODUCTS: Product[] = STATIC_CATEGORIES.flatMap((c) => c.products);

export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => String(p.id) === id);
}
