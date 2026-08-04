import { prisma, BudgetStatus, SaleStatus } from "@cleci/db";
import { commissionFromBps } from "@/lib/money";
import { DIAS_ATE_LIBERAR } from "@/lib/client-ownership";
import { diasDaFaixa, paraInputDate, type DateRange } from "@/lib/date-range";
import { getConfig } from "./config";
import { getGoalProgress, type GoalProgress } from "./goals";

/** Aviso quando a titularidade está a poucos dias de vencer. */
const DIAS_ALERTA_CARTEIRA = 7;

export type SellerDashboard = Awaited<ReturnType<typeof getSellerDashboard>>;

/**
 * Comissão do vendedor fixo. Ela NÃO existe como registro no banco (é paga fora
 * da plataforma), então é calculada aqui só para exibição: taxa individual do
 * vendedor, ou o padrão da equipe. Sem taxa definida, o painel diz isso em vez
 * de mostrar R$ 0,00 como se fosse o valor combinado.
 */
async function resolverTaxaComissao(userId: string) {
  const [user, config] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { commissionRateBps: true } }),
    getConfig(),
  ]);
  const individual = user?.commissionRateBps ?? null;
  const rateBps = individual ?? config.vendedorFixoBps;
  return { rateBps, configurada: rateBps > 0, individual: individual !== null };
}

export async function getSellerDashboard(userId: string, range: DateRange) {
  const agora = new Date();
  const corteCarteira = new Date(agora.getTime() - DIAS_ATE_LIBERAR * 86_400_000);
  const corteAlerta = new Date(
    corteCarteira.getTime() + DIAS_ALERTA_CARTEIRA * 86_400_000,
  );

  const noPeriodo = { gte: range.start, lt: range.end };

  const [
    vendasPagas,
    vendasPendentes,
    orcamentosPorStatus,
    orcamentosCriados,
    carteiraAtiva,
    carteiraAlerta,
    clientesNovos,
    meta,
    taxa,
    vendasDoPeriodo,
    orcamentosRecentes,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { userId, status: SaleStatus.PAGO, paidAt: noPeriodo },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { userId, status: SaleStatus.PENDENTE },
      _sum: { amountCents: true },
      _count: true,
    }),
    // Situação ATUAL dos orçamentos criados no período. Não há histórico de
    // transição no banco, então "aceitos" = criados no período e hoje aceitos.
    prisma.budget.groupBy({
      by: ["status"],
      where: { vendedorId: userId, createdAt: noPeriodo },
      _count: true,
      _sum: { totalCents: true },
    }),
    prisma.budget.count({ where: { vendedorId: userId, createdAt: noPeriodo } }),
    prisma.client.count({
      where: { vendedorId: userId, lastActivityAt: { gt: corteCarteira } },
    }),
    prisma.client.count({
      where: {
        vendedorId: userId,
        lastActivityAt: { gt: corteCarteira, lte: corteAlerta },
      },
    }),
    prisma.client.count({ where: { vendedorId: userId, createdAt: noPeriodo } }),
    getGoalProgress(userId),
    resolverTaxaComissao(userId),
    // Vendas do período com o cliente, para o gráfico e o ranking. O volume de
    // um vendedor cabe em memória; agregar por dia no SQL exigiria raw query.
    prisma.sale.findMany({
      where: { userId, status: SaleStatus.PAGO, paidAt: noPeriodo },
      orderBy: { paidAt: "asc" },
      take: 2000,
      select: {
        id: true,
        amountCents: true,
        paidAt: true,
        budget: {
          select: {
            id: true,
            number: true,
            client: { select: { id: true, name: true, companyName: true } },
          },
        },
      },
    }),
    prisma.budget.findMany({
      where: { vendedorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        docType: true,
        totalCents: true,
        createdAt: true,
        validUntil: true,
        client: { select: { name: true, companyName: true } },
      },
    }),
  ]);

  const contarStatus = (status: BudgetStatus) =>
    orcamentosPorStatus.find((g) => g.status === status)?._count ?? 0;

  const enviados = contarStatus(BudgetStatus.ENVIADO);
  const aceitos = contarStatus(BudgetStatus.ACEITO);
  const recusados = contarStatus(BudgetStatus.RECUSADO);
  const rascunhos = contarStatus(BudgetStatus.RASCUNHO);

  // Conversão sobre o que já foi respondido — rascunho ainda nem saiu.
  const respondidos = aceitos + recusados;
  const conversao = respondidos > 0 ? Math.round((aceitos / respondidos) * 100) : null;

  const totalVendidoCents = vendasPagas._sum.amountCents ?? 0;
  const quantidadeVendas = vendasPagas._count;
  const ticketMedioCents =
    quantidadeVendas > 0 ? Math.round(totalVendidoCents / quantidadeVendas) : 0;

  const emNegociacaoCents =
    orcamentosPorStatus.find((g) => g.status === BudgetStatus.ENVIADO)?._sum.totalCents ?? 0;

  // --- Evolução diária (uma barra por dia da faixa, inclusive dias sem venda).
  const porDia = new Map<string, number>();
  for (const venda of vendasDoPeriodo) {
    if (!venda.paidAt) continue;
    const chave = paraInputDate(venda.paidAt);
    porDia.set(chave, (porDia.get(chave) ?? 0) + venda.amountCents);
  }
  const evolucao = diasDaFaixa(range).map((dia) => {
    const chave = paraInputDate(dia);
    return { dia: chave, totalCents: porDia.get(chave) ?? 0 };
  });

  // --- Ranking de clientes por valor vendido no período.
  const porCliente = new Map<
    string,
    { id: string; nome: string; totalCents: number; vendas: number }
  >();
  for (const venda of vendasDoPeriodo) {
    const cliente = venda.budget?.client;
    if (!cliente) continue; // venda sem orçamento (checkout do site)
    const atual = porCliente.get(cliente.id) ?? {
      id: cliente.id,
      nome: cliente.companyName ?? cliente.name,
      totalCents: 0,
      vendas: 0,
    };
    atual.totalCents += venda.amountCents;
    atual.vendas += 1;
    porCliente.set(cliente.id, atual);
  }
  const topClientes = [...porCliente.values()]
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 5);

  return {
    range,
    vendas: {
      totalCents: totalVendidoCents,
      quantidade: quantidadeVendas,
      ticketMedioCents,
      pendentesCents: vendasPendentes._sum.amountCents ?? 0,
      pendentesQuantidade: vendasPendentes._count,
    },
    comissao: {
      rateBps: taxa.rateBps,
      configurada: taxa.configurada,
      individual: taxa.individual,
      totalCents: commissionFromBps(totalVendidoCents, taxa.rateBps),
      // Projeção sobre o que está enviado e ainda pode fechar.
      potencialCents: commissionFromBps(emNegociacaoCents, taxa.rateBps),
    },
    orcamentos: {
      criados: orcamentosCriados,
      rascunhos,
      enviados,
      aceitos,
      recusados,
      conversao,
      emNegociacaoCents,
    },
    carteira: {
      ativos: carteiraAtiva,
      novosNoPeriodo: clientesNovos,
      liberandoEmBreve: carteiraAlerta,
      diasAlerta: DIAS_ALERTA_CARTEIRA,
    },
    meta,
    evolucao,
    topClientes,
    orcamentosRecentes,
  };
}

export type { GoalProgress };
