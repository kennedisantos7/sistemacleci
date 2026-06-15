import { requireUser } from "@/server/session";
import { ComingSoon } from "@/components/coming-soon";

export default async function AdminSaquesPage() {
  await requireUser(["ADMIN"]);
  return <ComingSoon title="Gestão de saques" etapa="Etapa 4 (saldo e saques)" />;
}
