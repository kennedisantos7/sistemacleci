import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/session";
import { getBudgetForActor } from "@/server/services/budgets";
import { renderOrcamentoPdf } from "@/server/pdf/render-orcamento-pdf";
import { BUDGET_VIEW_ROLES } from "@/lib/rbac";
import { getCurrentArt } from "@/server/services/design";
import { DesignStatus } from "@cleci/db";
import type { BudgetUnit } from "@/lib/budget-math";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(BUDGET_VIEW_ROLES);
  const { id } = await ctx.params;

  // Escopado pelo papel: vendedor só exporta o próprio; equipe exporta todos.
  const budget = await getBudgetForActor(user, id);
  if (!budget) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Arte atual, quando existe. Vai como data URI: o @react-pdf nao busca URL
  // que exige sessao, e o arquivo esta no banco (nao ha URL publica).
  const art = await getCurrentArt(budget.id);
  const arte = art
    ? {
        src: `data:${art.mimeType};base64,${Buffer.from(art.data).toString("base64")}`,
        aprovada: budget.designStatus === DesignStatus.APROVADA,
      }
    : null;

  const pdf = await renderOrcamentoPdf({
    arte,
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

  const tipo = budget.docType === "PEDIDO" ? "pedido" : "orcamento";
  const cliente = slugParaNomeDeArquivo(budget.client.companyName ?? budget.client.name);
  const nome = [tipo, budget.number, cliente].filter(Boolean).join("-");

  // attachment: baixa direto no aparelho em vez de abrir o visualizador. No
  // celular, o "inline" abria uma aba e deixava o arquivo preso no navegador.
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nome}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Nome do cliente vira pedaço do nome do arquivo. Só ASCII minúsculo, dígito e
 * hífen: o valor entra num cabeçalho HTTP, então aspas, quebra de linha e
 * acento ficam de fora — não é cosmético, é o que impede injeção no header.
 */
function slugParaNomeDeArquivo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}
