"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, SaleOrigin, SaleStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { parseReaisToCents } from "@/lib/money";
import { createSale, markSalePaid } from "@/server/services/sales";
import { createPaymentLinkForSale } from "@/server/services/checkout";
import { isMercadoPagoConfigured } from "@/server/mercadopago";

const schema = z.object({
  amount: z.string().min(1),
  customerName: z.string().max(120).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  ref: z.string().regex(/^[0-9A-Za-z]{4,32}$/).optional().or(z.literal("")),
  note: z.string().max(500).optional(),
  action: z.enum(["mark_paid", "payment_link", "pending"]),
});

export type ManualSaleState = { error?: string; success?: string; paymentUrl?: string };

export async function registerManualSaleAction(
  _prev: ManualSaleState,
  formData: FormData,
): Promise<ManualSaleState> {
  const admin = await requireUser(STAFF_ROLES);

  const parsed = schema.safeParse({
    amount: formData.get("amount"),
    customerName: formData.get("customerName") || undefined,
    customerEmail: formData.get("customerEmail") || undefined,
    ref: formData.get("ref") || undefined,
    note: formData.get("note") || undefined,
    action: formData.get("action"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const amountCents = parseReaisToCents(parsed.data.amount);
  if (amountCents == null) return { error: "Valor inválido. Use o formato 123,45." };

  const sale = await createSale({
    amountCents,
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail || undefined,
    ref: parsed.data.ref || undefined,
    note: parsed.data.note,
    origin: SaleOrigin.WHATSAPP_MANUAL,
    gateway: parsed.data.action === "payment_link" ? "mercadopago" : null,
  });

  try {
    if (parsed.data.action === "mark_paid") {
      // Confirmação manual: marca paga e já gera as comissões (snapshot da taxa).
      await markSalePaid(sale);
      revalidatePath("/admin/vendas");
      return { success: "Venda registrada e marcada como paga." };
    }

    if (parsed.data.action === "payment_link") {
      if (!isMercadoPagoConfigured()) return { error: "Mercado Pago não configurado para gerar link." };
      const url = await createPaymentLinkForSale(sale, {
        productName: parsed.data.customerName
          ? `Pedido de ${parsed.data.customerName}`
          : undefined,
      });
      revalidatePath("/admin/vendas");
      return { success: "Venda registrada. Envie o link de pagamento ao cliente.", paymentUrl: url };
    }

    revalidatePath("/admin/vendas");
    return { success: "Venda registrada como pendente." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao processar." };
  } finally {
    void admin;
  }
}

/**
 * Confirma manualmente uma venda PENDENTE (ex.: indicação/WhatsApp em que o
 * cliente pagou fora do sistema). É o "confirmar a venda" que libera as
 * comissões — sem essa ação, nenhuma comissão é gerada para a venda.
 */
export async function confirmManualSalePaidAction(formData: FormData): Promise<void> {
  await requireUser(STAFF_ROLES);
  const saleId = String(formData.get("saleId") ?? "");
  if (!saleId) return;

  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale || sale.status !== SaleStatus.PENDENTE) return;

  await markSalePaid(sale);
  revalidatePath("/admin/vendas");
}
