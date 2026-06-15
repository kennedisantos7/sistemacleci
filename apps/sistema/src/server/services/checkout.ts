import { prisma, type Sale } from "@cleci/db";
import { getStripe } from "@/server/stripe";
import { env } from "@/env";

/**
 * Cria uma Checkout Session do Stripe para uma venda PENDENTE e grava o
 * session.id como gatewayOrderId (idempotência no webhook). Carrega ref e
 * saleId no metadata para reconciliação.
 */
export async function createCheckoutSession(
  sale: Sale,
  opts: { ref?: string | null; productName?: string; successUrl?: string; cancelUrl?: string },
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: sale.currency.toLowerCase(),
          unit_amount: sale.amountCents,
          product_data: { name: opts.productName ?? "Pedido Cleci Personalizados" },
        },
        quantity: 1,
      },
    ],
    customer_email: sale.customerEmail ?? undefined,
    metadata: { saleId: sale.id, ref: opts.ref ?? "" },
    payment_intent_data: { metadata: { saleId: sale.id } },
    success_url: opts.successUrl ?? `${env.SITE_URL}/?pago=1`,
    cancel_url: opts.cancelUrl ?? `${env.SITE_URL}/?cancelado=1`,
  });

  await prisma.sale.update({
    where: { id: sale.id },
    data: { gatewayOrderId: session.id, gateway: "stripe" },
  });

  if (!session.url) throw new Error("Stripe não retornou a URL do checkout.");
  return session.url;
}

/**
 * Cria um Payment Link para uma venda registrada manualmente (fluxo WhatsApp).
 * Útil para enviar a cobrança ao cliente após combinar o pedido.
 */
export async function createPaymentLinkForSale(
  sale: Sale,
  opts: { productName?: string },
): Promise<string> {
  const stripe = getStripe();

  const price = await stripe.prices.create({
    currency: sale.currency.toLowerCase(),
    unit_amount: sale.amountCents,
    product_data: { name: opts.productName ?? "Pedido Cleci Personalizados" },
  });

  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { saleId: sale.id },
  });

  await prisma.sale.update({
    where: { id: sale.id },
    data: { gateway: "stripe" },
  });

  return link.url;
}
