import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { signOutAction } from "./actions";
import { SidebarNav } from "./sidebar-nav";
import type { Role } from "@cleci/db";

const NAV: Record<Role, Array<{ href: string; label: string }>> = {
  ADMIN: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/usuarios", label: "Usuários" },
    { href: "/admin/vendas", label: "Vendas" },
    { href: "/admin/metas", label: "Metas" },
    { href: "/admin/comissoes", label: "Comissões" },
    { href: "/admin/saques", label: "Saques" },
  ],
  VENDEDOR_FIXO: [
    { href: "/vendedor", label: "Dashboard" },
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
  VENDEDOR_FIXO: "Vendedor",
  AFILIADO: "Afiliado",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.role) redirect("/login");

  const role = session.user.role;
  const items = NAV[role];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="text-xl font-heading font-extrabold text-primary">
            Cleci<span className="text-secondary">.</span>
          </span>
        </div>
        <SidebarNav items={items} />
        <div className="border-t border-border p-4">
          <p className="mb-1 text-sm font-medium">{session.user.name ?? session.user.email}</p>
          <p className="mb-3 text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
          <form action={signOutAction}>
            <Button variant="outline" size="sm" className="w-full" type="submit">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-muted/30 p-8">{children}</main>
    </div>
  );
}
