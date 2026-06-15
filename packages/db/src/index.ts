import { PrismaClient } from "@prisma/client";

// Singleton do PrismaClient para evitar esgotar o pool de conexões em dev
// (hot-reload do Next.js) e em ambientes serverless.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-exporta tipos e enums gerados para consumo nos apps.
export * from "@prisma/client";
