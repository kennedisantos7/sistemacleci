import { prisma } from "@cleci/db";
import { env } from "@/env";
import { generateRefCode } from "./ref";

/** Link curto compartilhável pelo afiliado/vendedor (conta clique no /go). */
export function buildShareUrl(ref: string): string {
  return `${env.SISTEMA_URL}/go/${ref}`;
}

/** Normaliza o slug informado em um caminho relativo do site (ex: "/tapetes"). */
export function normalizeSlug(slug?: string | null): string {
  const s = (slug ?? "").trim();
  if (!s) return "/";
  const path = s.startsWith("/") ? s : `/${s}`;
  // "//host" é URL protocol-relative e "\" vira "//" em parsers — ambos
  // permitiriam redirect para domínio externo via /go/[ref] (open redirect).
  if (path.startsWith("//") || path.includes("\\")) return "/";
  return path;
}

/** Monta a URL de destino (no site) a partir de um caminho. */
export function buildDestination(path: string): string {
  const base = new URL(env.SITE_URL);
  const url = new URL(path, base);
  // Defesa em profundidade: o destino DEVE ficar no domínio do site.
  if (url.origin !== base.origin) return base.toString();
  return url.toString();
}

export type CreateLinkInput = {
  userId: string;
  slug?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

/** Cria um link de afiliado com `ref` único (retry em caso de colisão). */
export async function createAffiliateLink(input: CreateLinkInput) {
  const path = normalizeSlug(input.slug);
  const destination = buildDestination(path);

  for (let attempt = 0; attempt < 6; attempt++) {
    const ref = generateRefCode(8);
    const exists = await prisma.affiliateLink.findUnique({ where: { ref } });
    if (exists) continue;

    return prisma.affiliateLink.create({
      data: {
        userId: input.userId,
        ref,
        slug: path === "/" ? null : path,
        destination,
        utmSource: input.utmSource || null,
        utmMedium: input.utmMedium || null,
        utmCampaign: input.utmCampaign || null,
      },
    });
  }

  throw new Error("Não foi possível gerar um código único. Tente novamente.");
}

/** Lista os links do usuário com contagem de vendas atribuídas. */
export async function listUserLinks(userId: string) {
  return prisma.affiliateLink.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sales: true } } },
  });
}

/** Ativa/desativa um link, garantindo que pertence ao usuário. */
export async function setLinkActive(userId: string, linkId: string, active: boolean) {
  const result = await prisma.affiliateLink.updateMany({
    where: { id: linkId, userId },
    data: { active },
  });
  if (result.count === 0) throw new Error("Link não encontrado.");
}
