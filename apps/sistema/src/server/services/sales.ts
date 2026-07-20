import { prisma, SaleStatus, SaleOrigin, UserStatus, type Sale } from "@cleci/db";
import { createCommissionForSale, cancelCommissionForSale } from "./commission";

/**
 * Resolve a atribuição a partir de um `ref`. Aceita:
 *  - ref de um link de campanha (AffiliateLink) ativo; ou
 *  - código pessoal de afiliação (User.affiliateCode) de uma conta ATIVA.
 * A comissão sempre vai para o usuário dono do ref/código.
 */
export async function resolveAttribution(ref?: string | null) {
  if (!ref) return { affiliateLinkId: null, userId: null };

  const link = await prisma.affiliateLink.findUnique({
    where: { ref },
    select: { id: true, userId: true, active: true },
  });
  if (link?.active) return { affiliateLinkId: link.id, userId: link.userId };

  const user = await prisma.user.findUnique({
    where: { affiliateCode: ref },
    select: { id: true, status: true },
  });
  if (user && user.status === UserStatus.ATIVO) {
    return { affiliateLinkId: null, userId: user.id };
  }

  return { affiliateLinkId: null, userId: null };
}

export type CreateSaleInput = {
  amountCents: number;
  currency?: string;
  customerEmail?: string | null;
  customerName?: string | null;
  ref?: string | null;
  origin: SaleOrigin;
  gateway?: string | null;
  gatewayOrderId?: string | null;
  status?: SaleStatus;
  note?: string | null;
};

/** Cria uma venda, atribuindo automaticamente ao afiliado pelo ref. */
export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const { affiliateLinkId, userId } = await resolveAttribution(input.ref);

  return prisma.sale.create({
    data: {
      amountCents: input.amountCents,
      currency: input.currency ?? "BRL",
      customerEmail: input.customerEmail ?? null,
      customerName: input.customerName ?? null,
      origin: input.origin,
      gateway: input.gateway ?? null,
      gatewayOrderId: input.gatewayOrderId ?? null,
      status: input.status ?? SaleStatus.PENDENTE,
      note: input.note ?? null,
      affiliateLinkId,
      userId,
    },
  });
}

/**
 * Marca uma venda como paga e gera a comissão (snapshot da taxa). Idempotente:
 * se já estava paga, não duplica a comissão.
 */
export async function markSalePaid(sale: Sale): Promise<void> {
  if (sale.status === SaleStatus.PAGO) {
    await createCommissionForSale(sale); // garante comissão mesmo em reprocessamento
    return;
  }
  const updated = await prisma.sale.update({
    where: { id: sale.id },
    data: { status: SaleStatus.PAGO, paidAt: new Date() },
  });
  await createCommissionForSale(updated);
}

/** Marca como reembolsada e cancela a comissão correspondente. */
export async function markSaleRefunded(sale: Sale): Promise<void> {
  await prisma.sale.update({
    where: { id: sale.id },
    data: { status: SaleStatus.REEMBOLSADO, refundedAt: new Date() },
  });
  await cancelCommissionForSale(sale.id);
}

/** Marca como recusada (pagamento falhou). */
export async function markSaleFailed(sale: Sale): Promise<void> {
  if (sale.status === SaleStatus.PAGO) return; // não rebaixa venda já paga
  await prisma.sale.update({
    where: { id: sale.id },
    data: { status: SaleStatus.RECUSADO },
  });
}
