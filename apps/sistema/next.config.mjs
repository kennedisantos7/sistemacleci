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
};

export default nextConfig;
