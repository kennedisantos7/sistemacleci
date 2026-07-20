import { MercadoPagoConfig } from "mercadopago";

let _client: MercadoPagoConfig | null = null;

/**
 * Config do Mercado Pago (lazy). Lança erro claro se o token não estiver
 * configurado, em vez de quebrar o boot do app inteiro.
 */
export function getMercadoPago(): MercadoPagoConfig {
  if (_client) return _client;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MP_ACCESS_TOKEN não configurada.");
  _client = new MercadoPagoConfig({ accessToken });
  return _client;
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}
