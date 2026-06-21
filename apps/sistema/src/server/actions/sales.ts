"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SaleOrigin } from "@cleci/db";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { parseReaisToCents } from "@/lib/money";
import { createSale, markSalePaid } from "@/server/services/sales";
import { createPaymentLinkForSale } from "@/server/services/checkout";
import { isStripeConfigured } from "@/server/stripe";

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
    gateway: parsed.data.action === "payment_link" ? "stripe" : null,
  });

  try {
    if (parsed.data.action === "mark_paid") {
      // Confirmação manual: marca paga e já gera a comissão (snapshot da taxa).
      await markSalePaid(sale);
      revalidatePath("/admin/vendas");
      return { success: "Venda registrada e marcada como paga." };
    }

    if (parsed.data.action === "payment_link") {
      if (!isStripeConfigured()) return { error: "Stripe não configurado para gerar link." };
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
