import {
  prisma,
  CommissionStatus,
  Role,
  SaleOrigin,
  UserStatus,
  type Commission,
  type Sale,
} from "@cleci/db";
import { commissionFromBps } from "@/lib/money";
import { getConfig } from "./config";

/**
 * Taxa do afiliado (bps) conforme o canal da venda:
 *  - CHECKOUT (link de pagamento / gateway) => venda fechada, taxa maior;
 *  - WHATSAPP_MANUAL (link de WhatsApp)     => apenas indicação, taxa menor.
 * As taxas são FIXAS e só o DESENVOLVEDOR pode alterá-las.
 */
export async function resolveAffiliateRateBps(origin: SaleOrigin): Promise<number> {
  const config = await getConfig();
  return origin === SaleOrigin.CHECKOUT ? config.afiliadoVendaBps : config.afiliadoIndicacaoBps;
}

/** Conta que recebe a participação do desenvolvedor (a mais antiga ativa). */
async function getDeveloperUserId(): Promise<string | null> {
  const dev = await prisma.user.findFirst({
    where: { role: Role.DESENVOLVEDOR, status: UserStatus.ATIVO },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return dev?.id ?? null;
}

/** Cria a comissão de um beneficiário na venda (idempotente e anti-corrida). */
async function upsertCommission(
  sale: Sale,
  userId: string,
  rateBps: number,
): Promise<Commission> {
  const key = { saleId_userId: { saleId: sale.id, userId } };

  const existing = await prisma.commission.findUnique({ where: key });
  if (existing) return existing;

  try {
    return await prisma.commission.create({
      data: {
        saleId: sale.id,
        userId,
        rateBps,
        amountCents: commissionFromBps(sale.amountCents, rateBps),
        status: CommissionStatus.PENDENTE,
      },
    });
  } catch {
    // Corrida: outro processo criou primeiro — relê e devolve.
    const again = await prisma.commission.findUnique({ where: key });
    if (again) return again;
    throw new Error("Falha ao registrar a comissão.");
  }
}

/**
 * Gera as comissões de uma venda paga, com SNAPSHOT das taxas. Idempotente.
 *
 * Regras:
 *  - Só vendas atribuídas a um AFILIADO geram comissão. Vendedor fixo é
 *    comissionado fora da plataforma (por enquanto).
 *  - Afiliado recebe a taxa do canal (venda no gateway x indicação WhatsApp).
 *  - Desenvolvedor recebe sua participação sobre a mesma venda.
 */
export async function createCommissionForSale(sale: Sale) {
  if (!sale.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sale.userId },
    select: { role: true },
  });
  if (user?.role !== Role.AFILIADO) return null;

  const config = await getConfig();
  const rateBps =
    sale.origin === SaleOrigin.CHECKOUT ? config.afiliadoVendaBps : config.afiliadoIndicacaoBps;

  const affiliateCommission = await upsertCommission(sale, sale.userId, rateBps);

  // Participação do desenvolvedor sobre a mesma venda.
  const devUserId = await getDeveloperUserId();
  if (devUserId && devUserId !== sale.userId) {
    await upsertCommission(sale, devUserId, config.desenvolvedorBps);
  }

  return affiliateCommission;
}

/**
 * Cancela as comissões de uma venda (reembolso/recusa). Não mexe em comissões
 * já LIBERADAS (pagas via saque) — esse caso vira ajuste manual pelo admin.
 */
export async function cancelCommissionForSale(saleId: string) {
  await prisma.commission.updateMany({
    where: {
      saleId,
      status: { in: [CommissionStatus.PENDENTE, CommissionStatus.APROVADA] },
    },
    data: { status: CommissionStatus.CANCELADA },
  });
}

/** Aprova uma comissão pendente, liberando-a para o saldo disponível. */
export async function approveCommission(commissionId: string) {
  await prisma.commission.updateMany({
    where: { id: commissionId, status: CommissionStatus.PENDENTE },
    data: { status: CommissionStatus.APROVADA, approvedAt: new Date() },
  });
}

/** Aprova em lote todas as comissões pendentes (uso administrativo). */
export async function approveAllPending(): Promise<number> {
  const result = await prisma.commission.updateMany({
    where: { status: CommissionStatus.PENDENTE },
    data: { status: CommissionStatus.APROVADA, approvedAt: new Date() },
  });
  return result.count;
}
