import Home from "@/views/Home";
import { loadAllProducts } from "@/server/catalog";

// Vitrine vem do banco (painel). Revalida a cada minuto.
export const revalidate = 60;

export default async function Page() {
  const products = await loadAllProducts();

  return <Home products={products} />;
}
