import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SaleOrigin } from "@cleci/db";
import { createSale } from "@/server/services/sales";
import { createCheckoutSession } from "@/server/services/checkout";
import { isStripeConfigured } from "@/server/stripe";
import { isValidIngestKey, rateLimit } from "@/server/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  amountCents: z.number().int().positive().max(100_000_000),
  currency: z.string().length(3).optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().max(120).optional(),
  ref: z.string().regex(/^[0-9A-Za-z]{4,32}$/).optional(),
  note: z.string().max(500).optional(),
  productName: z.string().max(200).optional(),
  createCheckout: z.boolean().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  // Autenticação por API key compartilhada (site confiável).
  if (!isValidIngestKey(req.headers.get("x-api-key"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Rate limit por IP (best-effort).
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`ingest:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 422 });
  }

  const data = parsed.data;
  const sale = await createSale({
    amountCents: data.amountCents,
    currency: data.currency,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    ref: data.ref,
    note: data.note,
    origin: SaleOrigin.CHECKOUT,
    gateway: "stripe",
  });

  // Opcionalmente já cria o checkout do Stripe e devolve a URL de pagamento.
  if (data.createCheckout && isStripeConfigured()) {
    try {
      const checkoutUrl = await createCheckoutSession(sale, {
        ref: data.ref,
        productName: data.productName,
        successUrl: data.successUrl,
        cancelUrl: data.cancelUrl,
      });
      return NextResponse.json({ saleId: sale.id, checkoutUrl }, { status: 201 });
    } catch (err) {
      return NextResponse.json(
        { saleId: sale.id, error: "checkout_failed", message: String(err) },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ saleId: sale.id }, { status: 201 });
}
