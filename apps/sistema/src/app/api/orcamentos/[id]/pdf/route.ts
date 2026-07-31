import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/session";
import { getBudgetForActor } from "@/server/services/budgets";
import { renderOrcamentoPdf } from "@/server/pdf/render-orcamento-pdf";
import { BUDGET_ROLES } from "@/lib/rbac";
import type { BudgetUnit } from "@/lib/budget-math";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(BUDGET_ROLES);
  const { id } = await ctx.params;

  // Escopado pelo papel: vendedor só exporta o próprio; equipe exporta todos.
  const budget = await getBudgetForActor(user, id);
  if (!budget) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const pdf = await renderOrcamentoPdf({
    number: budget.number,
    docType: budget.docType,
    createdAt: budget.createdAt,
    validUntil: budget.validUntil,
    title: budget.title,
    note: budget.note,
    paymentTerms: budget.paymentTerms,
    deliveryForecast: budget.deliveryForecast,
    deliveryCity: budget.deliveryCity,
    subtotalCents: budget.subtotalCents,
    discountCents: budget.discountCents,
    surchargeCents: budget.surchargeCents,
    freightCents: budget.freightCents,
    taxCents: budget.taxCents,
    totalCents: budget.totalCents,
    client: {
      name: budget.client.name,
      companyName: budget.client.companyName,
      document: budget.client.document,
      email: budget.client.email,
      phone: budget.client.phone,
      whatsapp: budget.client.whatsapp,
      contactName: budget.client.contactName,
      address: budget.client.address,
      city: budget.client.city,
      state: budget.client.state,
      zip: budget.client.zip,
    },
    vendedor: {
      name: budget.vendedor.name,
      email: budget.vendedor.email,
    },
    items: budget.items.map((item) => ({
      id: item.id,
      code: item.code,
      description: item.description,
      unit: item.unit as BudgetUnit,
      widthM: item.widthM ? Number(item.widthM) : null,
      lengthM: item.lengthM ? Number(item.lengthM) : null,
      areaM2: item.areaM2 ? Number(item.areaM2) : null,
      quantity: Number(item.quantity),
      unitPriceCents: item.unitPriceCents,
      partialCents: item.partialCents,
      totalCents: item.totalCents,
    })),
  });

  const slug = budget.docType === "PEDIDO" ? "pedido" : "orcamento";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}-${budget.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
