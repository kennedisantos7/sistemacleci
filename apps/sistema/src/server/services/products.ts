import { prisma, type Prisma } from "@cleci/db";

export type ProductInput = {
  categoryId: string;
  subcategoryId?: string | null;
  title: string;
  description?: string | null;
  priceCents?: number | null;
  imageUrl: string;
  gallery: string[];
  sizes: string[];
  codes: string[];
  badge?: string | null;
  badgeColor?: string | null;
  code?: string | null;
  active: boolean;
};

/** Categorias com seus subtipos (para os selects do formulário). */
export function listCategoriesWithSubs() {
  return prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { subcategories: { orderBy: { position: "asc" } } },
  });
}

export function listProducts(opts?: { search?: string; categoryId?: string }) {
  const where: Prisma.ProductWhereInput = {
    ...(opts?.search ? { title: { contains: opts.search, mode: "insensitive" } } : {}),
    ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
  };
  return prisma.product.findMany({
    where,
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { category: { select: { name: true } }, subcategory: { select: { name: true } } },
  });
}

export function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

/** Garante que o subtipo (se informado) pertence à categoria escolhida. */
async function assertValidCategory(categoryId: string, subcategoryId?: string | null) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error("Categoria inválida.");
  if (subcategoryId) {
    const sub = await prisma.subcategory.findFirst({
      where: { id: subcategoryId, categoryId },
      select: { id: true },
    });
    if (!sub) throw new Error("Subtipo não pertence à categoria escolhida.");
  }
}

export async function createProduct(data: ProductInput) {
  await assertValidCategory(data.categoryId, data.subcategoryId);
  return prisma.product.create({
    data: {
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId ?? null,
      title: data.title,
      description: data.description ?? null,
      priceCents: data.priceCents ?? null,
      imageUrl: data.imageUrl,
      gallery: data.gallery,
      sizes: data.sizes,
      codes: data.codes,
      badge: data.badge ?? null,
      badgeColor: data.badgeColor ?? null,
      code: data.code ?? null,
      active: data.active,
    },
  });
}

export async function updateProduct(id: string, data: ProductInput) {
  await assertValidCategory(data.categoryId, data.subcategoryId);
  const res = await prisma.product.updateMany({
    where: { id },
    data: {
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId ?? null,
      title: data.title,
      description: data.description ?? null,
      priceCents: data.priceCents ?? null,
      imageUrl: data.imageUrl,
      gallery: data.gallery,
      sizes: data.sizes,
      codes: data.codes,
      badge: data.badge ?? null,
      badgeColor: data.badgeColor ?? null,
      code: data.code ?? null,
      active: data.active,
    },
  });
  if (res.count === 0) throw new Error("Produto não encontrado.");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
}
