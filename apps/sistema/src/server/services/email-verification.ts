import crypto from "node:crypto";
import { prisma, UserStatus } from "@cleci/db";
import { env } from "@/env";
import { sendEmail, renderEmailLayout, escapeHtml } from "@/server/email";

/** Validade do link de confirmação. */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Só o hash vai para o banco; o valor em claro existe apenas no link. */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Gera um token novo para o usuário e invalida os anteriores — pedir um novo
 * link deve derrubar o antigo, senão um e-mail vazado continua valendo.
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  return token;
}

export function buildVerificationUrl(token: string): string {
  return `${env.SISTEMA_URL}/verificar-email?token=${encodeURIComponent(token)}`;
}

/**
 * Envia o e-mail de confirmação. Devolve `false` se o envio falhou — o cadastro
 * segue válido e o usuário pode pedir o reenvio na tela de login.
 */
export async function sendVerificationEmail(user: {
  id: string;
  name: string | null;
  email: string;
}): Promise<boolean> {
  const token = await createVerificationToken(user.id);
  const url = buildVerificationUrl(token);
  const firstName = user.name?.trim().split(/\s+/)[0] ?? "";

  const html = renderEmailLayout({
    title: "Confirme seu e-mail",
    bodyHtml: `
      <p style="margin:0 0 12px;">${firstName ? `Olá, ${escapeHtml(firstName)}!` : "Olá!"}</p>
      <p style="margin:0 0 12px;">
        Recebemos um cadastro no sistema da Cleci Personaliza com este e-mail.
        Clique no botão abaixo para confirmar que ele é seu.
      </p>
      <p style="margin:0;">O link vale por 24 horas.</p>`,
    ctaLabel: "Confirmar meu e-mail",
    ctaUrl: url,
    footerNote: "Se você não fez este cadastro, ignore esta mensagem — nada será criado no seu nome.",
  });

  const text = [
    firstName ? `Olá, ${firstName}!` : "Olá!",
    "",
    "Confirme seu e-mail no sistema da Cleci Personaliza acessando o link abaixo (válido por 24 horas):",
    url,
    "",
    "Se você não fez este cadastro, ignore esta mensagem.",
  ].join("\n");

  const sent = await sendEmail({
    to: user.email,
    subject: "Confirme seu e-mail — Cleci Personaliza",
    html,
    text,
  });

  // Sem provedor configurado o link ainda precisa ser recuperável em dev/suporte.
  if (!sent) console.warn(`[verificacao] Link de confirmação de ${user.email}: ${url}`);

  return sent;
}

export type VerificationResult =
  | { status: "verificado"; alreadyActive: boolean }
  | { status: "ja_confirmado"; alreadyActive: boolean }
  | { status: "invalido" }
  | { status: "expirado" };

/**
 * Consome o token e marca o e-mail como confirmado.
 *
 * Confirmar o e-mail NÃO libera o acesso por si só: a conta continua precisando
 * da aprovação do administrador (status ATIVO). São dois portões distintos.
 */
export async function consumeVerificationToken(token: string): Promise<VerificationResult> {
  if (!token) return { status: "invalido" };

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, status: true, emailVerified: true } } },
  });

  if (!record) return { status: "invalido" };

  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } }).catch(() => {});
    return { status: "expirado" };
  }

  const alreadyActive = record.user.status === UserStatus.ATIVO;

  if (record.user.emailVerified) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } }).catch(() => {});
    return { status: "ja_confirmado", alreadyActive };
  }

  // Token de uso único: confirma e apaga na mesma transação.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.user.id } }),
  ]);

  return { status: "verificado", alreadyActive };
}

/**
 * Reenvia o link para um e-mail. Responde sempre da mesma forma para o usuário
 * (quem chama não deve revelar se a conta existe) — enumeração de contas.
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  // Busca sem diferenciar maiúsculas: o cadastro grava o e-mail como digitado,
  // então "Joao@Gmail.com" e "joao@gmail.com" precisam achar a mesma conta.
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: { id: true, name: true, email: true, emailVerified: true },
  });

  if (!user || user.emailVerified) return; // nada a fazer; silêncio proposital
  await sendVerificationEmail(user);
}
