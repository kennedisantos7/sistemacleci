"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Substitui o `useSearchParams`/`setSearchParams` do react-router.
 * `setQuery` REesreve toda a query (igual ao comportamento anterior):
 * passe `{}` para limpar ou `{ tipo: "x" }` para definir.
 */
export function useQueryParams() {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  const setQuery = useCallback(
    (params: Record<string, string | undefined>) => {
      const next = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value) next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  return { searchParams, setQuery };
}
