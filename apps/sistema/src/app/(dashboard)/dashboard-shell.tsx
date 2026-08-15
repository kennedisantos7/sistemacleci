"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserCog, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { signOutAction } from "./actions";

type Item = { href: string; label: string };

/**
 * Logotipo da Cleci. PNG com fundo transparente e recortado na caixa do
 * conteudo (o JPG de origem tem margem branca em volta), então a altura pedida
 * é a altura da marca — sem espaço morto e sem quadrado branco sobre o card.
 * A largura acompanha por `w-auto`; o tamanho vem de quem usa.
 */
function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-cleci.png"
      alt="Cleci Personaliza"
      width={640}
      height={516}
      priority
      className={cn("w-auto", className)}
    />
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
        <Logo className="h-16" />
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
 * Casca responsiva do painel: sidebar fixa no desktop (lg+) e drawer com
 * botão hambúrguer abaixo disso.
 *
 * O corte é em lg (1024px), não md (768px), por causa do iPad em pé: a 768px a
 * sidebar comia 256px e sobravam ~460px de conteúdo, mas as telas já aplicavam
 * os layouts de duas/três colunas de `sm:`/`md:` — daí campo passando por cima
 * de campo. Em pé o iPad usa o drawer e a largura inteira; deitado (1024px)
 * ganha a sidebar.
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
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="rounded-md p-1.5 text-foreground/80 hover:bg-muted"
        >
          <Menu className="h-6 w-6" />
        </button>
        {/* Barra do celular é baixa (~48px): aqui a marca entra menor. */}
        <Logo className="h-9" />
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
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 lg:hidden",
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
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <SidebarContent items={items} userName={userName} roleLabel={roleLabel} />
      </aside>

      <main className="min-w-0 flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
