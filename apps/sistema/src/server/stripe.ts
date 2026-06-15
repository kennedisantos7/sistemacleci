import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Cliente Stripe (lazy). Lança erro claro se a chave não estiver configurada,
 * em vez de quebrar o boot do app inteiro.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
