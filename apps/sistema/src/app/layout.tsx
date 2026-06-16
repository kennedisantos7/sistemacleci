import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Cleci — Afiliados & Vendas",
  description: "Gestão de afiliados, vendas e comissões da Cleci Personalizados",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;900&family=Outfit:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
