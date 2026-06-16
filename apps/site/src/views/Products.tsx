"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Package, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryParams } from "../lib/use-query-params";
import ProductCard from "../components/ui/ProductCard";
import { TAPETES_CATALOG } from "../data/tapetes";
import { GRAFICA_CATALOG } from "../data/grafica";
import { SACOLAS_CATALOG } from "../data/sacolas";
import { PLAYGROUND_CATALOG } from "../data/playground";
import { MESAS_FREEZERS_CATALOG } from "../data/mesas-freezers";
import { SEGURANCA_CATALOG } from "../data/seguranca";
import { COMUNICACAO_VISUAL_CATALOG } from "../data/comunicacao-visual";
import { fuzzySearchProducts } from "../lib/fuzzySearch";

// ---------------------------------------------------------------------------
// All products pool
// ---------------------------------------------------------------------------
const ALL_PRODUCTS = [
  ...TAPETES_CATALOG,
  ...GRAFICA_CATALOG,
  ...SACOLAS_CATALOG,
  ...PLAYGROUND_CATALOG,
  ...MESAS_FREEZERS_CATALOG,
  ...SEGURANCA_CATALOG,
  ...COMUNICACAO_VISUAL_CATALOG,
];

const PAGE_SIZE = 24;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Products() {
  const { searchParams, setQuery } = useQueryParams();
  const queryParam = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(queryParam);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input in sync when URL changes (e.g. navigating back)
  useEffect(() => {
    setInputValue(queryParam);
  }, [queryParam]);

  const handleSearch = () => {
    const q = inputValue.trim();
    if (q) {
      setQuery({ q });
    } else {
      setQuery({});
    }
    setPage(1);
  };

  const clearSearch = () => {
    setInputValue("");
    setQuery({});
    setPage(1);
    inputRef.current?.focus();
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = queryParam.trim()
    ? fuzzySearchProducts(ALL_PRODUCTS, queryParam)
    : ALL_PRODUCTS;

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Sidebar Toggle ─────────────────────────────────────────────────────────
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // Reset to page 1 when query changes
  useEffect(() => {
    setPage(1);
  }, [queryParam]);

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-outline-variant/30 py-4">
        <div className="max-w-container-max mx-auto px-gutter md:px-gutter">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant font-body-md">
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-on-surface font-bold">Nossos Produtos</span>
            {queryParam && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-primary font-bold">"{queryParam}"</span>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-container-max mx-auto px-gutter md:px-gutter py-12 flex flex-col lg:flex-row gap-12">
        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          {/* Search bar inside Products */}
          <div className="relative mb-8">
            <label htmlFor="products-search" className="sr-only">Buscar produtos</label>
            <input
              ref={inputRef}
              id="products-search"
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar produtos..."
              className="w-full py-2.5 pl-4 pr-10 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm bg-white shadow-sm transition-all"
            />
            {inputValue ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSearch}
                aria-label="Pesquisar"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:opacity-75 transition-opacity"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="w-full flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container transition-colors"
            >
              <h2 className="font-headline-sm text-on-surface uppercase tracking-tighter text-sm">Categorias</h2>
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isCategoriesOpen ? "rotate-180" : ""}`} />
            </button>
            
            <div className={`transition-all duration-300 ease-in-out ${isCategoriesOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>
              <ul className="p-2 space-y-1">
                {[
                  { label: "Tapetes", path: "/tapetes", count: TAPETES_CATALOG.length },
                  { label: "Gráfica", path: "/grafica", count: GRAFICA_CATALOG.length },
                  { label: "Sacolas", path: "/sacolas", count: SACOLAS_CATALOG.length },
                  { label: "Playground", path: "/playground", count: PLAYGROUND_CATALOG.length },
                  { label: "MESAS", path: "/mesas-e-freezers", count: MESAS_FREEZERS_CATALOG.length },
                  { label: "Segurança", path: "/seguranca", count: SEGURANCA_CATALOG.length },
                  { label: "Comunicação Visual", path: "/comunicacao-visual", count: COMUNICACAO_VISUAL_CATALOG.length },
                ].map(({ label, path, count }) => (
                  <li key={path}>
                    <Link
                      href={path}
                      className="flex items-center justify-between w-full py-2 px-3 rounded-lg font-body-md text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                    >
                      <span>{label}</span>
                      <span className="text-[10px] opacity-60 bg-surface-container-high px-2 py-0.5 rounded-full font-bold">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* ── Grid ── */}
        <div className="flex-1">
          {/* Result header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            {queryParam ? (
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-headline-sm text-on-surface">
                  {filtered.length === 0
                    ? "Nenhum resultado"
                    : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`}
                  {" "}para{" "}
                  <span className="text-primary">"{queryParam}"</span>
                </h1>
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-1 text-xs text-on-surface-variant border border-outline-variant rounded-full px-3 py-1 hover:border-primary hover:text-primary transition-colors"
                >
                  <X className="w-3 h-3" /> Limpar
                </button>
              </div>
            ) : (
              <h1 className="font-headline-sm text-on-surface">
                {ALL_PRODUCTS.length} produtos disponíveis
              </h1>
            )}
            {totalPages > 1 && (
              <span className="text-sm text-on-surface-variant">
                Página {page} de {totalPages}
              </span>
            )}
          </div>

          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant gap-4">
              <Package className="w-16 h-16 opacity-20" />
              <p className="font-headline-sm text-center">Nenhum produto encontrado</p>
              <p className="text-sm text-center max-w-xs">
                Tente outros termos ou verifique a ortografia. A busca é tolerante a erros de digitação, mas o termo pode estar muito diferente.
              </p>
              <button
                onClick={clearSearch}
                className="mt-2 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Ver todos os produtos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-element-gap">
              {paginated.map((p) => (
                <ProductCard key={p.id} product={p} imageLoading="lazy" linkToDetail={false} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Paginação" className="mt-16 flex justify-center items-center gap-2">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-10 h-10 rounded-DEFAULT border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | "...")[]>((acc, n, idx, arr) => {
                  if (idx > 0 && (n as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-on-surface-variant">…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      aria-current={page === item ? "page" : undefined}
                      onClick={() => setPage(item as number)}
                      className={`w-10 h-10 rounded-DEFAULT text-sm font-bold transition-colors ${
                        page === item
                          ? "bg-primary text-white"
                          : "border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                type="button"
                aria-label="Próxima página"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-10 h-10 rounded-DEFAULT border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
