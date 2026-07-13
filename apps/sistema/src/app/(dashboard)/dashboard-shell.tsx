"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserCog, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { signOutAction } from "./actions";

type Item = { href: string; label: string };

function Wordmark() {
  return (
    <span className="text-xl font-heading font-extrabold text-primary">
      Cleci<span className="text-secondary">.</span>
    </span>
  );
}

/** Conteúdo da sidebar (compartilhado entre desktop e drawer mobile). */
function SidebarContent({
  items,
  userName,
  roleLabel,
  onClose,
}: {
  items: Item[];
  userName: string;
  roleLabel: string;
  /** Presente apenas no drawer mobile: fecha ao navegar e mostra o botão X. */
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-5">
        <Wordmark />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-md p-1.5 text-foreground/80 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <SidebarNav items={items} onNavigate={onClose} />
      <div className="border-t border-border p-4">
        <p className="mb-1 truncate text-sm font-medium">{userName}</p>
        <p className="mb-3 text-xs text-muted-foreground">{roleLabel}</p>
        <Link
          href="/conta"
          onClick={onClose}
          className="mb-2 flex items-center gap-2 rounded-md px-1 text-sm text-foreground/70 hover:text-foreground"
        >
          <UserCog className="h-4 w-4" /> Minha conta
        </Link>
        <form action={signOutAction}>
          <Button variant="outline" size="sm" className="w-full" type="submit">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </form>
      </div>
    </>
  );
}

/**
 * Casca responsiva do painel: sidebar fixa no desktop (md+) e drawer com
 * botão hambúrguer no mobile.
 */
export function DashboardShell({
  items,
  userName,
  roleLabel,
  children,
}: {
  items: Item[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  // Fecha o drawer em navegação e trava o scroll do body enquanto aberto.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="rounded-md p-1.5 text-foreground/80 hover:bg-muted"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Wordmark />
        <Link
          href="/conta"
          aria-label="Minha conta"
          className="rounded-md p-1.5 text-foreground/80 hover:bg-muted"
        >
          <UserCog className="h-6 w-6" />
        </Link>
      </header>

      {/* Drawer (mobile) */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
        aria-hidden={!open}
      >
        <aside
          className={cn(
            "flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-card transition-transform duration-300 ease-in-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label="Menu do painel"
        >
          <SidebarContent items={items} userName={userName} roleLabel={roleLabel} onClose={close} />
        </aside>
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <SidebarContent items={items} userName={userName} roleLabel={roleLabel} />
      </aside>

      <main className="min-w-0 flex-1 bg-muted/30 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
