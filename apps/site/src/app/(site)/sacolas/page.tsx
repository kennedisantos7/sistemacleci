import { Suspense } from "react";
import Sacolas from "@/views/Sacolas";
import { loadCategory } from "@/server/catalog";

// Catalogo vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export default async function Page() {
  const { products, slugs } = await loadCategory("sacolas");

  return (
    <Suspense fallback={null}>
      <Sacolas catalog={products} slugs={slugs} />
    </Suspense>
  );
}