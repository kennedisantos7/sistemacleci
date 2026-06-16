// ---------------------------------------------------------------------------
// Atribuição de afiliado (first-party no domínio do site).
// Lê ?ref= da URL e grava um cookie de 30/60/90 dias. Esse ref é depois
// carregado para a mensagem de WhatsApp (venda manual) e/ou enviado para o
// endpoint de ingestão de vendas do sistema (checkout online).
// ---------------------------------------------------------------------------

const COOKIE_NAME = "cleci_ref";

/** Duração do cookie em dias. Sobrescreva via NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS. */
const COOKIE_DAYS = Number(process.env.NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS ?? 30);

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  // SameSite=Lax cobre o fluxo de clique->navegação; Secure em produção (https).
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

/**
 * Captura o ?ref= da URL atual e persiste no cookie (last-touch: o ref mais
 * recente vence). Deve ser chamada uma vez no boot do app.
 */
export function captureRefFromUrl(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && /^[0-9A-Za-z]{4,32}$/.test(ref)) {
    setCookie(COOKIE_NAME, ref, COOKIE_DAYS);
  }
}

/** Retorna o ref de afiliado atribuído (ou null). */
export function getAttributedRef(): string | null {
  if (typeof window === "undefined") return null;
  return readCookie(COOKIE_NAME);
}

// ---------------------------------------------------------------------------
// Modo afiliado: o afiliado ativa pelo painel (abre o site com ?aff=CODE).
// O código fica no localStorage e habilita o botão "Copiar meu link" nos
// produtos. É só conveniência de UX; a atribuição real continua via ?ref=.
// ---------------------------------------------------------------------------

const AFF_KEY = "cleci_aff";
const AFF_EVENT = "cleci-aff-change";
const CODE_RE = /^[0-9A-Za-z]{4,32}$/;

/** Captura o ?aff= da URL e ativa o modo afiliado (localStorage). */
export function captureAffiliateMode(): void {
  if (typeof window === "undefined") return;
  const aff = new URLSearchParams(window.location.search).get("aff");
  if (aff && CODE_RE.test(aff)) {
    localStorage.setItem(AFF_KEY, aff);
    window.dispatchEvent(new Event(AFF_EVENT));
  }
}

/** Código do modo afiliado ativo (ou null). */
export function getAffiliateCode(): string | null {
  if (typeof window === "undefined") return null;
  const code = localStorage.getItem(AFF_KEY);
  return code && CODE_RE.test(code) ? code : null;
}

/** Desativa o modo afiliado. */
export function clearAffiliateMode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AFF_KEY);
  window.dispatchEvent(new Event(AFF_EVENT));
}

export const AFFILIATE_EVENT = AFF_EVENT;
