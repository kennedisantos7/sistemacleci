import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLE_HOME } from "@/lib/rbac";

// Rota raiz: encaminha para o painel correto da role (ou login).
export default async function RootPage() {
  const session = await auth();
  if (!session?.user?.role) redirect("/login");
  redirect(ROLE_HOME[session.user.role]);
}
