import Link from "next/link";
import { requireUser } from "@/server/session";
import { getSellerDashboard } from "@/server/services/seller-dashboard";
import { resolverPeriodo } from "@/lib/date-range";
import { PeriodFilter } from "@/components/period-filter";
import { SellerPerformance } from "@/components/seller-performance";

export const dynamic = "force-dynamic";

export default async function VendedorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  const params = await searchParams;
  const range = resolverPeriodo(params);
  const d = await getSellerDashboard(user.id, range);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Meu painel</h1>
        <p className="text-muted-foreground">
          Vendas, comissão e carteira — filtre pelo período que quiser acompanhar.
        </p>
      </header>

      <PeriodFilter range={range} basePath="/vendedor" />

      <SellerPerformance d={d} voz="propria" />

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/orcamentos" className="text-primary hover:underline">
          Ver todos os orçamentos →
        </Link>
        <Link href="/pedidos" className="text-primary hover:underline">
          Ver pedidos →
        </Link>
        <Link href="/clientes" className="text-primary hover:underline">
          Ver clientes →
        </Link>
      </div>
    </div>
  );
}
