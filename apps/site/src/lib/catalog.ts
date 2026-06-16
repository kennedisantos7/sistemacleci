import type { Product } from "../components/ui/ProductCard";
import { TAPETES_CATALOG } from "../data/tapetes";
import { GRAFICA_CATALOG } from "../data/grafica";
import { SACOLAS_CATALOG } from "../data/sacolas";
import { PLAYGROUND_CATALOG } from "../data/playground";
import { MESAS_FREEZERS_CATALOG } from "../data/mesas-freezers";
import { SEGURANCA_CATALOG } from "../data/seguranca";
import { COMUNICACAO_VISUAL_CATALOG } from "../data/comunicacao-visual";

export const ALL_PRODUCTS: Product[] = [
  ...TAPETES_CATALOG,
  ...GRAFICA_CATALOG,
  ...SACOLAS_CATALOG,
  ...PLAYGROUND_CATALOG,
  ...MESAS_FREEZERS_CATALOG,
  ...SEGURANCA_CATALOG,
  ...COMUNICACAO_VISUAL_CATALOG,
];

export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => String(p.id) === id);
}
