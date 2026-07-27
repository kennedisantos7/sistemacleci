import type { Metadata } from "next";
import ProductDetails from "@/views/ProductDetails";
import { loadProduct } from "@/server/catalog";

// Produto vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) {
    return { title: "Produto não encontrado | Cleci Personaliza" };
  }
  const title = `${product.title} | Cleci Personaliza`;
  const description =
    product.description?.slice(0, 160) ??
    `${product.title} — ${product.category} personalizado pela Cleci Personaliza.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [product.image],
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await loadProduct(id);

  return <ProductDetails product={product} />;
}
