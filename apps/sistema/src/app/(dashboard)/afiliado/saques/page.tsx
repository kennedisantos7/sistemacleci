import { requireUser } from "@/server/session";
import { ComingSoon } from "@/components/coming-soon";

export default async function AfiliadoSaquesPage() {
  await requireUser(["AFILIADO"]);
  return <ComingSoon title="Meus saques" etapa="Etapa 4 (saldo e saques)" />;
}
