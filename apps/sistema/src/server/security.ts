import { timingSafeEqual } from "node:crypto";

/** Comparação de strings em tempo constante (evita timing attacks na API key). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Valida o header de API key da ingestão de vendas (site -> sistema). */
export function isValidIngestKey(provided: string | null): boolean {
  const expected = process.env.INGEST_API_KEY;
  if (!expected || !provided) return false;
  return safeEqual(provided, expected);
}

// ---- Rate limit em memória (best-effort) ----
// Em produção multi-instância, troque por Redis. Suficiente para 1 réplica.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}
