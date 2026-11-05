import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AffiliateModeBar from "@/components/AffiliateModeBar";
import { getMenuPhotos } from "@/server/catalog-db";

// As fotos do menu vêm do banco. Sem isto, página estática (ex.: /privacidade)
// congelaria o menu do momento do build — quando o Docker nem tem banco.
export const revalidate = 60;

/** Moldura das páginas do site: barra de afiliado, Header e Footer. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const fotosDoMenu = await getMenuPhotos();
  return (
    <>
      <Suspense fallback={null}>
        <AffiliateModeBar />
      </Suspense>
      <div className="min-h-screen flex flex-col">
        <Header fotosDoMenu={fotosDoMenu} />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </div>
    </>
  );
}
