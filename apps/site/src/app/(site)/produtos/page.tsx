import { Suspense } from "react";
import Products from "@/views/Products";
import { loadAllProducts } from "@/server/catalog";

// Catalogo vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export default async function Page() {
  const products = await loadAllProducts();

  return (
    <Suspense fallback={null}>
      <Products products={products} />
    </Suspense>
  );
}
