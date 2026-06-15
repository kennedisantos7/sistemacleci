import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { prisma, type Prisma } from "@cleci/db";
import { getStripe } from "@/server/stripe";
import { processStripeEvent } from "@/server/services/webhook-stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  // Verificação de assinatura exige o corpo CRU (não parseado).
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return NextResponse.json({ error: "invalid_signature", message: String(err) }, { status: 400 });
  }

  // Idempotência: registra o evento; se já existe, foi processado antes.
  try {
    await prisma.webhookEvent.create({
      data: {
        gateway: "stripe",
        eventId: event.id,
        type: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Violação de unique (gateway+eventId): evento duplicado -> ok.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await processStripeEvent(event);
    await prisma.webhookEvent.update({
      where: { gateway_eventId: { gateway: "stripe", eventId: event.id } },
      data: { processed: true },
    });
  } catch (err) {
    // Mantém processed=false; responde 500 para o Stripe reenviar.
    return NextResponse.json({ error: "processing_failed", message: String(err) }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
