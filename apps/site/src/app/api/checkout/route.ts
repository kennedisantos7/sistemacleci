import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getProductById } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy server-side para o checkout. Mantém a INGEST_API_KEY fora do navegador:
 * o cliente chama esta rota, que chama o /api/sales/ingest do sistema e devolve
 * a URL do Stripe. O ref de afiliado vem do cookie first-party (cleci_ref).
 */
export async function POST(req: NextRequest) {
  let body: { productId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const product = getProductById(productId);
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
