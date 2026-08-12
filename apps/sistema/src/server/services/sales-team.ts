import { prisma, BudgetStatus, SaleStatus, Role, UserStatus } from "@cleci/db";
import { commissionFromBps } from "@/lib/money";
import { DIAS_ATE_LIBERAR } from "@/lib/client-ownership";
import type { DateRange } from "@/lib/date-range";
import { getConfig } from "./config";
import { currentPeriod, getGoalProgressMany, type GoalProgress } from "./goals";

/**
 * Visão da EQUIPE de vendas para o administrador: uma linha por vendedor, com
 * os mesmos números que cada um vê no próprio painel.
 *
 * Tudo é resolvido em consultas agrupadas (groupBy por vendedor), não chamando
 * getSellerDashboard num laço: aquele service faz ~11 consultas por pessoa e
 * serve à tela de UM vendedor. Aqui a lista precisa aguentar o time inteiro.
 *
 * Só VENDEDOR_FIXO entra. Afiliado não monta orçamento nem tem carteira — o
 * acompanhamento dele é por comissão e saque, que têm telas próprias.
 */

export type SellerRow = {
  id: string;
  nome: string;
  email: string;
  status: UserStatus;
  vendas: { totalCents: number; quantidade: number; ticketMedioCents: number };
  pendentes: { totalCents: number; quantidade: number };
  orcamentos: {
    criados: number;
    enviados: number;
    aceitos: number;
    recusados: number;
    /** Null quando nada foi respondido ainda — não é 0%. */
    conversao: number | null;
    emNegociacaoCents: number;
  };
  comissao: { rateBps: number; configurada: boolean; totalCents: number };
  clientesAtivos: number;
  meta: GoalProgress;
};

export type SalesTeamOverview = {
  vendedores: SellerRow[];
  totais: {
    vendedores: number;
    vendasCents: number;
    quantidade: number;
    ticketMedioCents: number;
    comissaoCents: number;
    emNegociacaoCents: number;
    orcamentosCriados: number;
    conversao: number | null;
  };
};

export async function getSalesTeamOverview(range: DateRange): Promise<SalesTeamOverview> {
  const vendedores = await prisma.user.findMany({
    where: { role: Role.VENDEDOR_FIXO },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, status: true, commissionRateBps: true },
  });

  if (vendedores.length === 0) {
    return { vendedores: [], totais: vazio() };
  }

  const ids = vendedores.map((v) => v.id);
  const noPeriodo = { gte: range.start, lt: range.end };
  const corteCarteira = new Date(Date.now() - DIAS_ATE_LIBERAR * 86_400_000);

  const [pagas, pendentes, orcamentos, carteiras, metas, config] = await Promise.all([
    prisma.sale.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: SaleStatus.PAGO, paidAt: noPeriodo },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    // Pendentes não filtram por período: é dinheiro parado, e o que importa é
    // quanto existe hoje esperando confirmação — não em qual mês nasceu.
    prisma.sale.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: SaleStatus.PENDENTE },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    // Situação ATUAL dos orçamentos criados no período (o banco não guarda
    // histórico de transição), igual ao critério do painel do vendedor.
    prisma.budget.groupBy({
      by: ["vendedorId", "status"],
      where: { vendedorId: { in: ids }, createdAt: noPeriodo },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    prisma.client.groupBy({
      by: ["vendedorId"],
      where: { vendedorId: { in: ids }, lastActivityAt: { gt: corteCarteira } },
      _count: { _all: true },
    }),
    getGoalProgressMany(ids, currentPeriod()),
    getConfig(),
  ]);

  const pagasPor = new Map(pagas.map((p) => [p.userId, p]));
  const pendentesPor = new Map(pendentes.map((p) => [p.userId, p]));
  const carteiraPor = new Map(carteiras.map((c) => [c.vendedorId, c._count._all]));

  const linhas: SellerRow[] = vendedores.map((v) => {
    const paga = pagasPor.get(v.id);
    const totalCents = paga?._sum.amountCents ?? 0;
    const quantidade = paga?._count._all ?? 0;

    const doVendedor = orcamentos.filter((o) => o.vendedorId === v.id);
    const contar = (s: BudgetStatus) =>
      doVendedor.find((o) => o.status === s)?._count._all ?? 0;

    const aceitos = contar(BudgetStatus.ACEITO);
    const recusados = contar(BudgetStatus.RECUSADO);
    const respondidos = aceitos + recusados;
    const emNegociacaoCents =
      doVendedor.find((o) => o.status === BudgetStatus.ENVIADO)?._sum.totalCents ?? 0;

    // Taxa individual do vendedor, ou o padrão da equipe. A comissão do
    // vendedor fixo não vira registro no banco (é paga fora), então é sempre
    // cálculo de exibição — ver seller-dashboard.ts.
    const rateBps = v.commissionRateBps ?? config.vendedorFixoBps;

    const pendente = pendentesPor.get(v.id);

    return {
      id: v.id,
      nome: v.name ?? v.email,
      email: v.email,
      status: v.status,
      vendas: {
        totalCents,
        quantidade,
        ticketMedioCents: quantidade > 0 ? Math.round(totalCents / quantidade) : 0,
      },
      pendentes: {
        totalCents: pendente?._sum.amountCents ?? 0,
        quantidade: pendente?._count._all ?? 0,
      },
      orcamentos: {
        criados: doVendedor.reduce((s, o) => s + o._count._all, 0),
        enviados: contar(BudgetStatus.ENVIADO),
        aceitos,
        recusados,
        conversao: respondidos > 0 ? Math.round((aceitos / respondidos) * 100) : null,
        emNegociacaoCents,
      },
      comissao: {
        rateBps,
        configurada: rateBps > 0,
        totalCents: commissionFromBps(totalCents, rateBps),
      },
      clientesAtivos: carteiraPor.get(v.id) ?? 0,
      meta: metas.get(v.id)!,
    };
  });

  // Maior faturamento primeiro: o painel é um ranking, não uma lista telefônica.
  linhas.sort((a, b) => b.vendas.totalCents - a.vendas.totalCents);

  const soma = (f: (l: SellerRow) => number) => linhas.reduce((s, l) => s + f(l), 0);
  const vendasCents = soma((l) => l.vendas.totalCents);
  const quantidade = soma((l) => l.vendas.quantidade);
  const aceitos = soma((l) => l.orcamentos.aceitos);
  const respondidos = aceitos + soma((l) => l.orcamentos.recusados);

  return {
    vendedores: linhas,
    totais: {
      vendedores: linhas.length,
      vendasCents,
      quantidade,
      ticketMedioCents: quantidade > 0 ? Math.round(vendasCents / quantidade) : 0,
      comissaoCents: soma((l) => l.comissao.totalCents),
      emNegociacaoCents: soma((l) => l.orcamentos.emNegociacaoCents),
      orcamentosCriados: soma((l) => l.orcamentos.criados),
      conversao: respondidos > 0 ? Math.round((aceitos / respondidos) * 100) : null,
    },
  };
}

function vazio(): SalesTeamOverview["totais"] {
  return {
    vendedores: 0,
    vendasCents: 0,
    quantidade: 0,
    ticketMedioCents: 0,
    comissaoCents: 0,
    emNegociacaoCents: 0,
    orcamentosCriados: 0,
    conversao: null,
  };
}

/** Dados de cabeçalho do perfil. Null quando o id não é de um vendedor fixo. */
export async function getSellerProfile(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: Role.VENDEDOR_FIXO },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      commissionRateBps: true,
    },
  });
  return user;
}
