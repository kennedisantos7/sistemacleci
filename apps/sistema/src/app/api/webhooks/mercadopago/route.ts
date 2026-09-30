import { NextResponse, type NextRequest } from "next/server";
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import { prisma, type Prisma } from "@cleci/db";
import { processMercadoPagoPayment } from "@/server/services/webhook-mercadopago";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const bodyText = await req.text();
  let body: { type?: string; data?: { id?: string } };
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // O Mercado Pago manda o data.id tanto na query string quanto no corpo,
  // dependendo do tipo de notificação; aceitamos os dois.
  const dataId = req.nextUrl.searchParams.get("data.id") ?? body.data?.id ?? null;

  try {
    WebhookSignatureValidator.validate({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId,
      secret,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ error: "invalid_signature", reason: err.reason }, { status: 401 });
    }
    throw err;
  }

  // Só processamos notificações de pagamento.
  if (body.type !== "payment" || !dataId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  // O registro é só auditoria — NÃO pula reprocessamento. O Mercado Pago reenvia
  // o MESMO data.id a cada mudança de status (pendente → aprovado → estornado) e
  // a cada nova tentativa depois de um 500. Descartar o repetido perdia a
  // aprovação do Pix e o estorno. Reprocessar é seguro: o status vem sempre da
  // API e as marcações de venda/comissão são idempotentes.
  const payload = body as unknown as Prisma.InputJsonValue;
  await prisma.webhookEvent.upsert({
    where: { gateway_eventId: { gateway: "mercadopago", eventId: dataId } },
    create: { gateway: "mercadopago", eventId: dataId, type: body.type, payload },
    update: { payload, processed: false },
  });

  try {
    await processMercadoPagoPayment(dataId);
    await prisma.webhookEvent.update({
      where: { gateway_eventId: { gateway: "mercadopago", eventId: dataId } },
      data: { processed: true },
    });
  } catch (err) {
    // Mantém processed=false; responde 500 para o Mercado Pago reenviar.
    return NextResponse.json({ error: "processing_failed", message: String(err) }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
