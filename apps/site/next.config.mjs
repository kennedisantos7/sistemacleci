import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Raiz de tracing = raiz do monorepo (evita inferência errada por lockfiles).
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Standalone só no build Docker (Coolify). Em dev no Windows o passo de
  // cópia do standalone falha por symlink (EPERM).
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // links.cleci.com.br era um app separado (cleci-links). Agora a página mora
    // em /links; o subdomínio aponta para este app e só redireciona.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "links.cleci.com.br" }],
        destination: "https://cleci.com.br/links",
        permanent: false,
      },
    ];
  },
  images: {
    // O catálogo usa <img> com URLs externas (imgur). Liberado caso migremos
    // para next/image no futuro.
    remotePatterns: [
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "imgur.com" },
    ],
  },
};

export default nextConfig;
