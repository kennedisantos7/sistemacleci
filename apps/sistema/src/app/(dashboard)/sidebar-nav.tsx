"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Link2,
  Package,
  Palette,
  Percent,
  Tags,
  Target,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

/**
 * Ícone de cada rota. Mora aqui, e não em `layout.tsx`, porque componente não
 * atravessa a fronteira servidor→cliente como prop: o menu é montado no
 * servidor e só o `href` viaja.
 */
const ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/usuarios": Users,
  "/admin/produtos": Package,
  "/admin/tabela-precos": Tags,
  "/admin/vendas": TrendingUp,
  "/admin/metas": Target,
  "/admin/saques": Banknote,
  "/admin/comissoes": Percent,
  "/orcamentos": FileText,
  "/pedidos": ClipboardList,
  "/clientes": Building2,
  "/design": Palette,
  "/vendedor": LayoutDashboard,
  "/vendedor/links": Link2,
  "/afiliado": LayoutDashboard,
  "/afiliado/links": Link2,
  "/afiliado/saques": Wallet,
};

export function SidebarNav({
  items,
  onNavigate,
}: {
  items: Item[];
  /** Chamado ao clicar num link (fecha o drawer no mobile). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex-1 space-y-0.5 px-3">
      {items.map((item) => {
        // "Dashboard" (índice) só ativo na rota exata; demais por prefixo.
        const isIndex = item.href.split("/").length === 2;
        const active = isIndex ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = ICONS[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg py-2 pl-4 pr-3 text-sm font-medium",
              "transition-all duration-200 ease-out",
              active
                ? "bg-primary/10 text-primary"
                : "text-foreground/70 hover:translate-x-0.5 hover:bg-muted hover:text-foreground",
            )}
          >
            {/* Barra do item ativo: cresce a partir do meio ao entrar. */}
            <span
              aria-hidden
              className={cn(
                "absolute left-0 w-1 rounded-r-full bg-primary transition-all duration-300 ease-out",
                active ? "h-6 opacity-100" : "h-0 opacity-0",
              )}
            />
            {Icon ? (
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  active ? "scale-110" : "group-hover:scale-110",
                )}
              />
            ) : null}
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
