import Link from "next/link";
import { notFound } from "next/navigation";
import { UserStatus } from "@cleci/db";
import { requireUser } from "@/server/session";
import { STAFF_ROLES } from "@/lib/rbac";
import { getSellerProfile } from "@/server/services/sales-team";
import { getSellerDashboard } from "@/server/services/seller-dashboard";
import { resolverPeriodo } from "@/lib/date-range";
import { PeriodFilter } from "@/components/period-filter";
import { SellerPerformance } from "@/components/seller-performance";
import { bpsToPercent } from "@/lib/money";

export const dynamic = "force-dynamic";

/**
 * Perfil de um vendedor visto pelo administrador. É o mesmo painel que o
 * vendedor abre em /vendedor — mesmo service, mesmos números —, com o cabeçalho
 * da conta por cima e atalhos para o que o admin costuma fazer em seguida
 * (mexer na meta, na comissão, ou abrir os documentos daquela pessoa).
 */
export default async function VendedorPerfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  await requireUser(STAFF_ROLES);
  const { id } = await params;

  const vendedor = await getSellerProfile(id);
  // 404 também quando o id existe mas não é vendedor fixo: afiliado e equipe
  // não têm este painel, e inventar uma tela vazia para eles só confunde.
  if (!vendedor) notFound();

  const range = resolverPeriodo(await searchParams);
  const d = await getSellerDashboard(vendedor.id, range);

  const nome = vendedor.name ?? vendedor.email;
  const base = `/admin/vendedores/${vendedor.id}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/vendedores" className="text-sm text-primary hover:underline">
          ← Voltar para o painel de vendas
        </Link>
      </div>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{nome}</h1>
          <p className="text-muted-foreground">
            {vendedor.email} · na equipe desde{" "}
            {vendedor.createdAt.toLocaleDateString("pt-BR")} ·{" "}
            {vendedor.commissionRateBps === null
              ? "comissão no padrão da equipe"
              : `comissão individual de ${bpsToPercent(vendedor.commissionRateBps)}`}
          </p>
        </div>
        {vendedor.status === UserStatus.ATIVO ? null : (
          <span className="w-fit shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
            {vendedor.status === UserStatus.BLOQUEADO ? "Conta bloqueada" : "Conta pendente"}
          </span>
        )}
      </header>

      <PeriodFilter range={range} basePath={base} />

      <SellerPerformance d={d} voz="admin" nome={nome} />

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/metas" className="text-primary hover:underline">
          Definir a meta do mês →
        </Link>
        <Link href="/admin/usuarios" className="text-primary hover:underline">
          Ajustar comissão ou acesso →
        </Link>
        <Link href="/orcamentos" className="text-primary hover:underline">
          Ver orçamentos da equipe →
        </Link>
      </div>
    </div>
  );
}
