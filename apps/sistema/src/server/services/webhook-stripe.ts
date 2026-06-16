import type Stripe from "stripe";
import { prisma, type Sale } from "@cleci/db";
import { getStripe } from "@/server/stripe";
import {
  findSaleByGatewayOrderId,
  markSalePaid,
  markSaleRefunded,
  markSaleFailed,
} from "@/server/services/sales";

async function findSaleById(saleId?: string | null): Promise<Sale | null> {
  if (!saleId) return null;
  return prisma.sale.findUnique({ where: { id: saleId } });
}

/**
 * Processa um evento Stripe JÁ VERIFICADO. Lança em erro inesperado para que
 * o webhook responda != 2xx e o Stripe reenvie (a idempotência protege).
 */
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const sale =
        (await findSaleById(session.metadata?.saleId)) ??
        (await findSaleByGatewayOrderId(session.id));
      if (sale) {
        // Captura o e-mail informado no checkout, se ainda não tínhamos.
        const email = session.customer_details?.email;
        if (email && !sale.customerEmail) {
          await prisma.sale.update({ where: { id: sale.id }, data: { customerEmail: email } });
        }
        await markSalePaid(sale);
      }
      break;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const sale = await findSaleById(pi.metadata?.saleId);
      if (sale) await markSalePaid(sale);
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const sale = await findSaleById(pi.metadata?.saleId);
      if (sale) await markSaleFailed(sale);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      let saleId = charge.metadata?.saleId;
      // Fallback: busca o saleId no PaymentIntent associado.
      if (!saleId && charge.payment_intent) {
        const pi = await getStripe().paymentIntents.retrieve(String(charge.payment_intent));
        saleId = pi.metadata?.saleId;
      }
      const sale = await findSaleById(saleId);
      if (sale) await markSaleRefunded(sale);
      break;
    }

    default:
      // Evento não tratado: ignora (já foi registrado para auditoria).
      break;
  }
}
