import { z } from "zod";

// Validação das variáveis de ambiente no boot — falha rápido se faltar algo.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET muito curto"),
  NEXTAUTH_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ATTRIBUTION_COOKIE_DAYS: z.coerce.number().int().positive().default(30),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  SISTEMA_URL: z.string().url().default("http://localhost:3001"),
  INGEST_API_KEY: z.string().min(16).optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  ATTRIBUTION_COOKIE_DAYS: process.env.ATTRIBUTION_COOKIE_DAYS,
  SITE_URL: process.env.SITE_URL,
  SISTEMA_URL: process.env.SISTEMA_URL,
  INGEST_API_KEY: process.env.INGEST_API_KEY,
});
