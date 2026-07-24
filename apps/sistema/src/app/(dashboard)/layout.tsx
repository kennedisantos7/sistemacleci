import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "./dashboard-shell";
import type { Role } from "@cleci/db";

// Admin: opera tudo, menos as taxas (fixas, só o desenvolvedor altera).
const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/vendas", label: "Vendas" },
  { href: "/admin/metas", label: "Metas" },
  { href: "/admin/saques", label: "Saques" },
];

// Desenvolvedor: tudo do admin + taxas do programa + saque da própria parte.
const DEV_NAV = [
  ...ADMIN_NAV,
  { href: "/admin/comissoes", label: "Comissões" },
  { href: "/afiliado/saques", label: "Meus saques" },
];

// Gerente: gestão de vendedores/vendas/metas, sem o financeiro sensível
// (comissões e saques ficam só para admin/desenvolvedor).
const GERENTE_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/vendas", label: "Vendas" },
  { href: "/admin/metas", label: "Metas" },
];

const NAV: Record<Role, Array<{ href: string; label: string }>> = {
  ADMIN: ADMIN_NAV,
  DESENVOLVEDOR: DEV_NAV,
  GERENTE: GERENTE_NAV,
  VENDEDOR_FIXO: [
    { href: "/vendedor", label: "Dashboard" },
    { href: "/vendedor/orcamentos", label: "Orçamentos" },
    { href: "/vendedor/clientes", label: "Clientes" },
    { href: "/vendedor/links", label: "Meus Links" },
  ],
  AFILIADO: [
    { href: "/afiliado", label: "Dashboard" },
    { href: "/afiliado/links", label: "Meus Links" },
    { href: "/afiliado/saques", label: "Saques" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador",
  DESENVOLVEDOR: "Desenvolvedor",
  GERENTE: "Gerente",
  VENDEDOR_FIXO: "Vendedor",
  AFILIADO: "Afiliado",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.role) redirect("/login");

  const role = session.user.role;

  return (
    <DashboardShell
      items={NAV[role]}
      userName={session.user.name ?? session.user.email ?? ""}
      roleLabel={ROLE_LABEL[role]}
    >
      {children}
    </DashboardShell>
  );
}
