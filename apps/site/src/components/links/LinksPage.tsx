"use client";

/**
 * LinksPage – página de links ("link na bio") da Cleci Personaliza.
 *
 *   src/data/links-page.ts         – textos, links e caminhos das imagens
 *   src/components/links/*.tsx     – seções da página
 *   src/components/links/links.css – estilos (classes com prefixo lk-)
 *   public/images/links/           – imagens
 */
import "./links.css";
import LinksHero from "./LinksHero";
import LinkCard from "./LinkCard";
import LinksAbout from "./LinksAbout";
import LinksProducts from "./LinksProducts";
import LinksFooter from "./LinksFooter";
import { LINKS } from "@/data/links-page";

export default function LinksPage({ fontClassName = "" }: { fontClassName?: string }) {
  return (
    <div className={`lk-root ${fontClassName}`}>
      <div className="lk-page">
        <main className="lk-main">
          <LinksHero />

          {/* A seção NÃO anima — só o conteúdo interno, evitando o fundo branco. */}
          <section aria-label="Catálogos de produtos" className="lk-links-grid">
            <div className="lk-links-grid__content">
              {LINKS.map((item, index) => (
                <LinkCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>

          <LinksAbout />
          <LinksProducts />
        </main>

        <LinksFooter />
      </div>
    </div>
  );
}
