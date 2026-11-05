import { Suspense } from "react";
import ComunicacaoVisual from "@/views/ComunicacaoVisual";
import { loadCategory } from "@/server/catalog";

// Catalogo vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export default async function Page() {
  const { products, slugs } = await loadCategory("comunicacao-visual");

  return (
    <Suspense fallback={null}>
      <ComunicacaoVisual catalog={products} slugs={slugs} />
    </Suspense>
  );
}