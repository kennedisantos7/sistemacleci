import { Suspense } from "react";
import Playground from "@/views/Playground";
import { loadCategory } from "@/server/catalog";

// Catalogo vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export default async function Page() {
  const { products, slugs } = await loadCategory("playground");

  return (
    <Suspense fallback={null}>
      <Playground catalog={products} slugs={slugs} />
    </Suspense>
  );
}