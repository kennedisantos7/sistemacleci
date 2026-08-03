import { env } from "@/env";

/**
 * Envio de e-mail transacional via Resend, por HTTP puro — sem SDK.
 *
 * Motivo de não usar SMTP: a maioria dos provedores de VPS bloqueia as portas
 * de saída 25/465/587, e a Hostinger não é exceção. Uma chamada HTTPS passa
 * sem configuração extra de rede.
 *
 * Trocar de provedor significa reescrever só `deliver()`.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Alternativa em texto puro (bom para entregabilidade e leitores simples). */
  text?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

/**
 * Tenta enviar o e-mail. NÃO lança: devolve `false` quando não foi possível.
 * Quem chama decide o que dizer ao usuário — um cadastro não deve falhar só
 * porque o provedor de e-mail está fora do ar.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn(
      `[email] RESEND_API_KEY não configurada — e-mail para ${input.to} não enviado ("${input.subject}").`,
    );
    return false;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
      }),
      // Não deixa uma indisponibilidade do provedor travar a requisição.
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // O corpo do erro do Resend ajuda a diagnosticar (domínio não verificado,
      // chave inválida...). Não vaza para o usuário final.
      const detail = await res.text().catch(() => "");
      console.error(`[email] Falha ao enviar para ${input.to}: HTTP ${res.status} ${detail}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[email] Erro ao enviar para ${input.to}:`, error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const BLUE = "#1541FC";

/** Escapa texto interpolado no HTML do e-mail (nome do usuário, etc.). */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Casca visual dos e-mails: tabela + estilo inline, porque clientes de e-mail
 * (Outlook em especial) ignoram flexbox/grid e boa parte do CSS externo.
 */
export function renderEmailLayout(options: {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const { title, bodyHtml, ctaLabel, ctaUrl, footerNote } = options;

  const cta =
    ctaLabel && ctaUrl
      ? `
        <tr>
          <td style="padding:8px 0 24px;">
            <a href="${ctaUrl}" style="background:${BLUE};color:#ffffff;text-decoration:none;display:inline-block;padding:13px 26px;border-radius:6px;font-weight:bold;font-size:15px;">${escapeHtml(ctaLabel)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">
            Se o botão não funcionar, copie e cole este endereço no navegador:<br>
            <span style="color:${BLUE};word-break:break-all;">${ctaUrl}</span>
          </td>
        </tr>`
      : "";

  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1a1c1c;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:${BLUE};padding:20px 28px;">
              <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">Cleci Personaliza</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:19px;font-weight:bold;padding-bottom:12px;">${escapeHtml(title)}</td>
                </tr>
                <tr>
                  <td style="font-size:15px;line-height:1.6;color:#374151;padding-bottom:20px;">${bodyHtml}</td>
                </tr>
                ${cta}
              </table>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5e7eb;padding:16px 28px;color:#6b7280;font-size:11px;line-height:1.5;">
              ${footerNote ? `${escapeHtml(footerNote)}<br><br>` : ""}
              CLESIENE CAVALCANTE DA SILVA · CNPJ 28.402.051/0001-69<br>
              Porto Nacional - TO · Este é um e-mail automático, não responda.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { escapeHtml };
