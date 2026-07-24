/**
 * Migração única do catálogo: importa os 66 produtos hoje hardcoded em
 * apps/site/src/data/*.ts para as tabelas Category/Subcategory/Product.
 *
 * Idempotente: usa ids determinísticos (seed_<cat>_<idOriginal>) para
 * produtos e upsert por slug para categorias/subtipos — pode rodar de novo
 * sem duplicar. Preserva as URLs de imagem atuais (imgur).
 *
 * Rodar: pnpm --filter @cleci/db exec tsx prisma/seed-catalog.ts
 */
import { PrismaClient } from "@prisma/client";

// Catálogos e slugs do site (imports type-only lá dentro — não puxa React).
import { SACOLAS_SLUGS, SACOLAS_CATALOG } from "../../../apps/site/src/data/sacolas";
import { TAPETES_SLUGS, TAPETES_CATALOG } from "../../../apps/site/src/data/tapetes";
import { GRAFICA_SLUGS, GRAFICA_CATALOG } from "../../../apps/site/src/data/grafica";
import {
  COMUNICACAO_VISUAL_SLUGS,
  COMUNICACAO_VISUAL_CATALOG,
} from "../../../apps/site/src/data/comunicacao-visual";
import { SEGURANCA_SLUGS, SEGURANCA_CATALOG } from "../../../apps/site/src/data/seguranca";
import { PLAYGROUND_SLUGS, PLAYGROUND_CATALOG } from "../../../apps/site/src/data/playground";
import {
  MESAS_FREEZERS_SLUGS,
  MESAS_FREEZERS_CATALOG,
} from "../../../apps/site/src/data/mesas-freezers";

const prisma = new PrismaClient();

type SiteProduct = {
  id: number | string;
  title: string;
  category: string;
  image: string;
  badge?: string | null;
  badgeColor?: string;
  sizes?: string[];
  borders?: unknown;
  code?: string;
  codes?: string[];
  description?: string;
  images?: string[];
  priceCents?: number;
};

type CatConfig = {
  name: string;
  slug: string;
  path: string;
  slugs: Record<string, string>; // slug -> label
  catalog: SiteProduct[];
};

const CATEGORIES: CatConfig[] = [
  { name: "Sacolas", slug: "sacolas", path: "/sacolas", slugs: SACOLAS_SLUGS, catalog: SACOLAS_CATALOG as SiteProduct[] },
  { name: "Tapetes", slug: "tapetes", path: "/tapetes", slugs: TAPETES_SLUGS, catalog: TAPETES_CATALOG as SiteProduct[] },
  { name: "Gráfica", slug: "grafica", path: "/grafica", slugs: GRAFICA_SLUGS, catalog: GRAFICA_CATALOG as SiteProduct[] },
  { name: "Comunicação Visual", slug: "comunicacao-visual", path: "/comunicacao-visual", slugs: COMUNICACAO_VISUAL_SLUGS, catalog: COMUNICACAO_VISUAL_CATALOG as SiteProduct[] },
  { name: "Segurança", slug: "seguranca", path: "/seguranca", slugs: SEGURANCA_SLUGS, catalog: SEGURANCA_CATALOG as SiteProduct[] },
  { name: "Playground", slug: "playground", path: "/playground", slugs: PLAYGROUND_SLUGS, catalog: PLAYGROUND_CATALOG as SiteProduct[] },
  { name: "Mesas e Freezers", slug: "mesas-e-freezers", path: "/mesas-e-freezers", slugs: MESAS_FREEZERS_SLUGS, catalog: MESAS_FREEZERS_CATALOG as SiteProduct[] },
];

async function main() {
  let totalProducts = 0;

  for (let ci = 0; ci < CATEGORIES.length; ci++) {
    const cfg = CATEGORIES[ci]!;

    const category = await prisma.category.upsert({
      where: { slug: cfg.slug },
      update: { name: cfg.name, path: cfg.path, position: ci },
      create: { name: cfg.name, slug: cfg.slug, path: cfg.path, position: ci },
    });

    // Subtipos + mapa label -> subcategoryId (product.category é o rótulo).
    const labelToSubId = new Map<string, string>();
    const slugEntries = Object.entries(cfg.slugs);
    for (let si = 0; si < slugEntries.length; si++) {
      const [subSlug, label] = slugEntries[si]!;
      const sub = await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: subSlug } },
        update: { name: label, position: si },
        create: { categoryId: category.id, slug: subSlug, name: label, position: si },
      });
      labelToSubId.set(label, sub.id);
    }

    // Produtos
    for (let pi = 0; pi < cfg.catalog.length; pi++) {
      const p = cfg.catalog[pi]!;
      const id = `seed_${cfg.slug}_${p.id}`;
      const subcategoryId = labelToSubId.get(p.category) ?? null;
      const borders = p.borders ? (p.borders as object) : undefined;

      const data = {
        categoryId: category.id,
        subcategoryId,
        title: p.title,
        description: p.description ?? null,
        priceCents: p.priceCents ?? null,
        imageUrl: p.image,
        gallery: p.images ?? [],
        sizes: p.sizes ?? [],
        codes: p.codes ?? [],
        badge: p.badge ?? null,
        badgeColor: p.badgeColor ?? null,
        code: p.code ?? null,
        active: true,
        position: pi,
      };

      await prisma.product.upsert({
        where: { id },
        update: { ...data, ...(borders !== undefined ? { borders } : {}) },
        create: { id, ...data, ...(borders !== undefined ? { borders } : {}) },
      });
      totalProducts++;
    }

    console.log(`✓ ${cfg.name}: ${cfg.catalog.length} produtos, ${slugEntries.length} subtipos`);
  }

  console.log(`\n✅ Catálogo migrado: ${CATEGORIES.length} categorias, ${totalProducts} produtos.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
