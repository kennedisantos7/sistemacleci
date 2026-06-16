import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AttributionTracker from "../components/AttributionTracker";
import AffiliateModeBar from "../components/AffiliateModeBar";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://cleci.com.br"),
  title: "Cleci Personaliza | Sacolas, Tapetes e Comunicação Visual",
  description:
    "Especialista em Sacolas Personalizadas, Tapetes e Comunicação Visual. Qualidade premium, durabilidade e entrega para todo o Brasil. Solicite seu orçamento agora!",
  keywords:
    "sacolas personalizadas, tapetes personalizados, comunicação visual, banners, ecobag, sacola kraft, sacola TNT, gráfica, Porto Nacional TO",
  authors: [{ name: "Cleci Personaliza" }],
  robots: "index, follow",
  icons: { icon: "/icons/logotipo.jpg", apple: "/icons/logotipo.jpg" },
  openGraph: {
    type: "website",
    siteName: "Cleci Personaliza",
    title: "Cleci Personaliza | Qualidade em Personalização",
    description:
      "Referência em Sacolas, Tapetes e Comunicação Visual. Transformamos sua marca com produtos personalizados de alta qualidade.",
    locale: "pt_BR",
    images: ["/icons/logotipo.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1541FC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;900&family=Outfit:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <AttributionTracker />
        </Suspense>
        <Suspense fallback={null}>
          <AffiliateModeBar />
        </Suspense>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
