import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Standalone só no build Docker (Coolify). Em dev no Windows o passo de
  // cópia do standalone falha por symlink (EPERM), então deixamos desligado.
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  reactStrictMode: true,
  // O client do Prisma vive no pacote compartilhado @cleci/db
  transpilePackages: ["@cleci/db"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
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
  // Orçamentos/clientes deixaram de ser só do vendedor e viraram rotas
  // compartilhadas com admin/gerente. Links antigos continuam funcionando.
  async redirects() {
    return [
      { source: "/vendedor/orcamentos", destination: "/orcamentos", permanent: true },
      { source: "/vendedor/orcamentos/:path*", destination: "/orcamentos/:path*", permanent: true },
      { source: "/vendedor/clientes", destination: "/clientes", permanent: true },
      { source: "/vendedor/clientes/:path*", destination: "/clientes/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
