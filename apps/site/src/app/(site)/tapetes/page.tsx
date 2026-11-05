import { Suspense } from "react";
import Tapetes from "@/views/Tapetes";
import { loadCategory } from "@/server/catalog";

// Catalogo vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export default async function Page() {
  const { products, slugs } = await loadCategory("tapetes");

  return (
    <Suspense fallback={null}>
      <Tapetes catalog={products} slugs={slugs} />
    </Suspense>
  );
}