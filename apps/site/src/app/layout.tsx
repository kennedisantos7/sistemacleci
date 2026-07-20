import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AttributionTracker from "../components/AttributionTracker";
import AffiliateModeBar from "../components/AffiliateModeBar";
import AccountAffiliateSync from "../components/AccountAffiliateSync";

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

const GTM_ID = "GTM-NKX3CBZV";

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
        {/* Google Tag Manager */}
        <Script id="gtm-base" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Suspense fallback={null}>
          <AttributionTracker />
        </Suspense>
        <Suspense fallback={null}>
          <AffiliateModeBar />
        </Suspense>
        <AccountAffiliateSync />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
