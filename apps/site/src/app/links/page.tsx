import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import LinksPage from "@/components/links/LinksPage";

// A página de links usa Montserrat (o resto do site usa Nunito/Outfit).
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--lk-font",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CLECI PERSONALIZA | Links",
  description: "Sacolas, cartões de visita e muito mais com a CLECI PERSONALIZA. Faça seu orçamento!",
  alternates: { canonical: "/links" },
  openGraph: {
    type: "website",
    url: "/links",
    siteName: "Cleci Personaliza",
    title: "CLECI PERSONALIZA | Links",
    description: "Sacolas, cartões de visita e muito mais com a CLECI PERSONALIZA. Faça seu orçamento!",
    locale: "pt_BR",
    images: ["/images/links/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "CLECI PERSONALIZA | Links",
    images: ["/images/links/logo.png"],
  },
};

export default function Page() {
  return <LinksPage fontClassName={montserrat.variable} />;
}
