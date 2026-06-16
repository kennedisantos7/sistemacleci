"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

export function SidebarNav({ items }: { items: Item[] }) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex-1 space-y-1 px-3">
      {items.map((item) => {
        // "Dashboard" (índice) só ativo na rota exata; demais por prefixo.
        const isIndex = item.href.split("/").length === 2;
        const active = isIndex ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-foreground/70 hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
