import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/session";
import { getBudgetForVendedor } from "@/server/services/budgets";
import { renderOrcamentoPdf } from "@/server/pdf/render-orcamento-pdf";
import { prisma } from "@cleci/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const { id } = await ctx.params;

  // Escopado ao vendedor: ninguém exporta orçamento de outra conta.
  const budget = await getBudgetForVendedor(user.id, id);
  if (!budget) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const vendedor = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  const pdf = await renderOrcamentoPdf({
    number: budget.number,
    createdAt: budget.createdAt,
    validUntil: budget.validUntil,
    title: budget.title,
    note: budget.note,
    totalCents: budget.totalCents,
    client: {
      name: budget.client.name,
      companyName: budget.client.companyName,
      document: budget.client.document,
      email: budget.client.email,
      phone: budget.client.phone,
    },
    vendedor: { name: vendedor?.name ?? null, email: vendedor?.email ?? user.email },
    items: budget.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalCents,
    })),
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-${budget.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
