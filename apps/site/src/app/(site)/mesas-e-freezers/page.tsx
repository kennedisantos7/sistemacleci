import { Suspense } from "react";
import MesasFreezers from "@/views/MesasFreezers";
import { loadCategory } from "@/server/catalog";

// Catalogo vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export default async function Page() {
  const { products, slugs } = await loadCategory("mesas-e-freezers");

  return (
    <Suspense fallback={null}>
      <MesasFreezers catalog={products} slugs={slugs} />
    </Suspense>
  );
}