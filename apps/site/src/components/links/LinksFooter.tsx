import Link from "next/link";
import { LINKS_BRAND, DEV_LOGO } from "@/data/links-page";

export default function LinksFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="lk-footer">
      <div className="lk-footer__content">
        <div className="lk-footer__brand-wrap">
          <Link href="/" aria-label="Ir para o site da Cleci Personaliza">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LINKS_BRAND.logo} alt={LINKS_BRAND.name} className="lk-footer__logo" loading="lazy" />
          </Link>
          <p className="lk-footer__copy">
            © {currentYear} {LINKS_BRAND.name} <br /> Todos os direitos reservados.
          </p>
        </div>

        <div className="lk-footer__dev">
          <span className="lk-footer__dev-text">desenvolvido por</span>
          <a href="https://www.instagram.com/kennidianderson/" target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DEV_LOGO} alt="Desenvolvedor" className="lk-footer__dev-logo" loading="lazy" />
          </a>
        </div>
      </div>
    </footer>
  );
}
