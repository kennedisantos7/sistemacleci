import { prisma } from "@cleci/db";

/**
 * Publicação de um produto do cadastro na vitrine do site.
 *
 * O cadastro (PriceItem) e a vitrine (Product) continuam sendo dois registros:
 * o primeiro é o que o orçamento consome — código único, preço por unidade —,
 * o segundo é o que o site mostra, com galeria, bordas e linhas. Publicar é
 * criar/atualizar o segundo a partir do primeiro e guardar o vínculo.
 *
 * Despublicar NÃO apaga: só desliga o `active` da vitrine. Assim os detalhes
 * de site (galeria, variantes, selo) sobrevivem a ligar e desligar a chave —
 * apagar faria o admin perder esse trabalho a cada troca de ideia.
 */

/** O que falta para este produto poder ir ao site. Vazio = pode publicar. */
export function pendenciasParaPublicar(item: {
  imageUrl: string | null;
  categoryId: string | null;
}): string[] {
  const faltando: string[] = [];
  // Os dois são obrigatórios na vitrine: o site monta o card com foto e
  // organiza a navegação por categoria.
  if (!item.imageUrl) faltando.push("a foto");
  if (!item.categoryId) faltando.push("a categoria");
  return faltando;
}

export async function publishToSite(priceItemId: string) {
  const item = await prisma.priceItem.findUnique({
    where: { id: priceItemId },
    select: {
      id: true,
      code: true,
      description: true,
      priceCents: true,
      imageUrl: true,
      categoryId: true,
      subcategoryId: true,
      siteProductId: true,
    },
  });
  if (!item) throw new Error("Produto não encontrado.");

  const faltando = pendenciasParaPublicar(item);
  if (faltando.length > 0) {
    throw new Error(`Para subir no site, preencha ${faltando.join(" e ")}.`);
  }

  // Já publicado alguma vez: reaproveita o registro (e os detalhes de vitrine
  // que o admin tenha ajustado por lá) em vez de criar outro.
  if (item.siteProductId) {
    await prisma.product.update({
      where: { id: item.siteProductId },
      data: {
        title: item.description,
        priceCents: item.priceCents || null,
        imageUrl: item.imageUrl!,
        categoryId: item.categoryId!,
        subcategoryId: item.subcategoryId,
        code: item.code,
        active: true,
      },
    });
    return;
  }

  const ultimo = await prisma.product.findFirst({
    where: { categoryId: item.categoryId! },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.$transaction(async (tx) => {
    const produto = await tx.product.create({
      data: {
        title: item.description,
        priceCents: item.priceCents || null,
        imageUrl: item.imageUrl!,
        categoryId: item.categoryId!,
        subcategoryId: item.subcategoryId,
        code: item.code,
        active: true,
        position: (ultimo?.position ?? 0) + 1,
      },
    });
    await tx.priceItem.update({
      where: { id: item.id },
      data: { siteProductId: produto.id },
    });
  });
}

/** Tira da vitrine sem apagar o registro — a chave pode voltar a ser ligada. */
export async function unpublishFromSite(priceItemId: string) {
  const item = await prisma.priceItem.findUnique({
    where: { id: priceItemId },
    select: { siteProductId: true },
  });
  if (!item?.siteProductId) return;
  await prisma.product.update({
    where: { id: item.siteProductId },
    data: { active: false },
  });
}

