import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { loadProduct } from "@/server/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productId: z.string().min(1).max(120),
});

/**
 * Proxy server-side para o checkout. Mantém a INGEST_API_KEY fora do navegador:
 * o cliente chama esta rota, que chama o /api/sales/ingest do sistema e devolve
 * a URL do Mercado Pago. O ref de afiliado vem do cookie first-party (cleci_ref).
 */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "produto inválido" }, { status: 400 });
  }

  // O preço vem SEMPRE do catálogo — nunca do corpo da requisição.
  const product = await loadProduct(parsed.data.productId);
  if (!product || !product.priceCents) {
    return NextResponse.json({ error: "produto sem checkout online" }, { status: 400 });
  }

  const sistemaUrl = process.env.SISTEMA_URL;
  const apiKey = process.env.INGEST_API_KEY;
  if (!sistemaUrl || !apiKey) {
    return NextResponse.json({ error: "checkout indisponível" }, { status: 500 });
  }

  const ref = (await cookies()).get("cleci_ref")?.value;
  const origin = new URL(req.url).origin;

  let res: Response;
  try {
    res = await fetch(`${sistemaUrl}/api/sales/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        amountCents: product.priceCents,
        productName: product.title,
        ...(ref ? { ref } : {}),
        createCheckout: true,
        successUrl: `${origin}/sucesso`,
        cancelUrl: `${origin}/cancelado`,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "sistema indisponível" }, { status: 502 });
  }

  const data = (await res.json().catch(() => ({}))) as { checkoutUrl?: string };
  if (!res.ok || !data.checkoutUrl) {
    return NextResponse.json({ error: "não foi possível iniciar o pagamento" }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: data.checkoutUrl });
}
