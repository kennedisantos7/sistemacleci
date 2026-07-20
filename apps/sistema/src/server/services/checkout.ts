import { Preference } from "mercadopago";
import { prisma, type Sale } from "@cleci/db";
import { getMercadoPago } from "@/server/mercadopago";
import { env } from "@/env";

/** Converte centavos em reais (unidade exigida pela API do Mercado Pago). */
function centsToUnits(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Cria uma Preference (Checkout Pro) do Mercado Pago para uma venda PENDENTE
 * e grava o id da preferência como gatewayOrderId (rastreabilidade). O
 * external_reference é o próprio saleId — é o campo mais confiável para
 * reconciliar o pagamento no webhook.
 */
export async function createCheckoutSession(
  sale: Sale,
  opts: { ref?: string | null; productName?: string; successUrl?: string; cancelUrl?: string },
): Promise<string> {
  const preference = new Preference(getMercadoPago());

  const result = await preference.create({
    body: {
      items: [
        {
          id: sale.id,
          title: opts.productName ?? "Pedido Cleci Personalizados",
          quantity: 1,
          currency_id: sale.currency,
          unit_price: centsToUnits(sale.amountCents),
        },
      ],
      payer: sale.customerEmail ? { email: sale.customerEmail } : undefined,
      external_reference: sale.id,
      metadata: { saleId: sale.id, ref: opts.ref ?? "" },
      notification_url: `${env.SISTEMA_URL}/api/webhooks/mercadopago`,
      back_urls: {
        success: opts.successUrl ?? `${env.SITE_URL}/?pago=1`,
        pending: opts.cancelUrl ?? `${env.SITE_URL}/?pendente=1`,
        failure: opts.cancelUrl ?? `${env.SITE_URL}/?cancelado=1`,
      },
      auto_return: "approved",
    },
  });

  await prisma.sale.update({
    where: { id: sale.id },
    data: { gatewayOrderId: result.id, gateway: "mercadopago" },
  });

  if (!result.init_point) throw new Error("Mercado Pago não retornou a URL do checkout.");
  return result.init_point;
}

/**
 * Cria um link de pagamento (Preference) para uma venda registrada
 * manualmente (fluxo WhatsApp). Útil para enviar a cobrança ao cliente após
 * combinar o pedido.
 */
export async function createPaymentLinkForSale(
  sale: Sale,
  opts: { productName?: string },
): Promise<string> {
  return createCheckoutSession(sale, { productName: opts.productName });
}
