import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { signOutAction } from "./actions";
import type { Role } from "@cleci/db";

const NAV: Record<Role, Array<{ href: string; label: string }>> = {
  ADMIN: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/usuarios", label: "Usuários" },
    { href: "/admin/vendas", label: "Vendas" },
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
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="font-semibold">Cleci</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
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
