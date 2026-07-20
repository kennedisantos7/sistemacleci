import { Payment } from "mercadopago";
import { getMercadoPago } from "@/server/mercadopago";
import { prisma } from "@cleci/db";
import { markSalePaid, markSaleRefunded, markSaleFailed } from "@/server/services/sales";

/**
 * Processa uma notificação de pagamento JÁ VERIFICADA (assinatura confirmada).
 * Busca o pagamento na API do Mercado Pago (nunca confia no corpo do webhook
 * para dados sensíveis) e atualiza a venda conforme o status.
 *
 * A venda é localizada pelo `external_reference`, que é sempre o próprio
 * saleId (definido na criação da preference em checkout.ts) — não há
 * necessidade de outro identificador para reconciliar.
 */
export async function processMercadoPagoPayment(paymentId: string | number): Promise<void> {
  const payment = new Payment(getMercadoPago());
  const result = await payment.get({ id: paymentId });

  const saleId = result.external_reference;
  if (!saleId) return; // pagamento sem referência à nossa venda (ignora)

  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale) return;

  switch (result.status) {
    case "approved":
      await markSalePaid(sale);
      break;
    case "refunded":
    case "charged_back":
      await markSaleRefunded(sale);
      break;
    case "rejected":
    case "cancelled":
      await markSaleFailed(sale);
      break;
    default:
      // "pending" / "in_process": aguarda próxima notificação.
      break;
  }
}
