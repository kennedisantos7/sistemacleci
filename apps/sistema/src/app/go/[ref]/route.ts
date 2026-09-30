import { NextResponse, type NextRequest } from "next/server";
import { prisma, UserStatus } from "@cleci/db";
import { env } from "@/env";

// Shortlink de afiliado: conta o clique e redireciona (302) para o site
// anexando ?ref=CODE. O COOKIE de atribuição é gravado pelo SITE (first-party),
// não aqui — cookie no domínio do sistema não atribuiria a venda no site.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ ref: string }> }) {
  const { ref } = await ctx.params;

  const link = await prisma.affiliateLink.findUnique({
    where: { ref },
    include: { user: { select: { status: true } } },
  });

  // Link inexistente, desativado ou de conta não ativa: home do site, sem
  // atribuição. Mandar o ref sobrescreveria (last-touch) uma indicação válida.
  if (!link || !link.active || link.user.status !== UserStatus.ATIVO) {
    return NextResponse.redirect(env.SITE_URL, { status: 302 });
  }

  // Incrementa o clique de forma atômica (não bloqueia o redirect em caso de erro).
  prisma.affiliateLink
    .update({ where: { id: link.id }, data: { clicks: { increment: 1 } } })
    .catch(() => {});

  const url = new URL(link.destination);
  // Nunca redireciona para fora do site (anti open-redirect, cobre links legados).
  if (url.origin !== new URL(env.SITE_URL).origin) {
    return NextResponse.redirect(env.SITE_URL, { status: 302 });
  }
  url.searchParams.set("ref", link.ref);
  if (link.utmSource) url.searchParams.set("utm_source", link.utmSource);
  if (link.utmMedium) url.searchParams.set("utm_medium", link.utmMedium);
  if (link.utmCampaign) url.searchParams.set("utm_campaign", link.utmCampaign);

  return NextResponse.redirect(url.toString(), { status: 302 });
}
