import { Suspense } from "react";
import Grafica from "@/views/Grafica";
import { loadCategory } from "@/server/catalog";

// Catalogo vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export default async function Page() {
  const { products, slugs } = await loadCategory("grafica");

  return (
    <Suspense fallback={null}>
      <Grafica catalog={products} slugs={slugs} />
    </Suspense>
  );
}