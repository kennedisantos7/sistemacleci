/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
