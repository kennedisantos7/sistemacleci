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

  // Idempotência: registra o evento; se já existe, foi processado antes.
  try {
    await prisma.webhookEvent.create({
      data: {
        gateway: "mercadopago",
        eventId: dataId,
        type: body.type,
        payload: body as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Violação de unique (gateway+eventId): evento duplicado -> ok.
    return NextResponse.json({ received: true, duplicate: true });
  }

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
