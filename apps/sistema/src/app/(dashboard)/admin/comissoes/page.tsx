import { requireUser } from "@/server/session";
import { ComingSoon } from "@/components/coming-soon";

export default async function AdminComissoesPage() {
  await requireUser(["ADMIN"]);
  return <ComingSoon title="Configuração de comissões" etapa="Etapa 3 (vendas) / Etapa 4 (saldo)" />;
}
