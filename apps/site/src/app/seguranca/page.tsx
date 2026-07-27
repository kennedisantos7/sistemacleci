import { Suspense } from "react";
import Seguranca from "@/views/Seguranca";
import { loadCategory } from "@/server/catalog";

// Catalogo vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export default async function Page() {
  const { products, slugs } = await loadCategory("seguranca");

  return (
    <Suspense fallback={null}>
      <Seguranca catalog={products} slugs={slugs} />
    </Suspense>
  );
}