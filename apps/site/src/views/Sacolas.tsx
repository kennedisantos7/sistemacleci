"use client";

import { useMemo } from "react";
import { ChevronRight, ShoppingBag, Filter, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useQueryParams } from "../lib/use-query-params";
import { cn } from "../lib/utils";
import ProductCard from "../components/ui/ProductCard";
import { SACOLAS_CATALOG, SACOLAS_SLUGS } from "../data/sacolas";

const CATEGORIAS = Object.values(SACOLAS_SLUGS);

const SLUG_TO_LABEL = SACOLAS_SLUGS;
const LABEL_TO_SLUG = Object.fromEntries(
  Object.entries(SACOLAS_SLUGS).map(([slug, label]) => [label, slug])
);

export default function Sacolas() {
  const { searchParams, setQuery } = useQueryParams();
  const tipoParam = searchParams.get("tipo");
  const categoriaAtiva = tipoParam ? SLUG_TO_LABEL[tipoParam] : null;
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const produtosFiltrados = useMemo(() => {
    if (!categoriaAtiva) return SACOLAS_CATALOG;
    return SACOLAS_CATALOG.filter((p) => p.category === categoriaAtiva);
  }, [categoriaAtiva]);

  function selecionar(label: string | null) {
    if (!label) setQuery({});
    else setQuery({ tipo: LABEL_TO_SLUG[label] });
    setShowFiltersMobile(false);
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter py-12">

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2 mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Início</Link>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
        <Link href="/produtos" className="hover:text-primary transition-colors">Produtos</Link>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
        {categoriaAtiva ? (
          <>
            <Link href="/sacolas" className="hover:text-primary transition-colors">Sacolas</Link>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <span className="text-on-surface" aria-current="page">{categoriaAtiva}</span>
          </>
        ) : (
          <span className="text-on-surface" aria-current="page">Sacolas</span>
        )}
      </nav>

      {/* Cabeçalho - Oculto no mobile se os filtros não estiverem abertos */}
      <div className={cn(
        "mb-10 border-b border-outline-variant pb-6",
        !showFiltersMobile && "hidden lg:block"
      )}>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          {categoriaAtiva ? categoriaAtiva : "Sacolas"}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? "s" : ""} encontrado{produtosFiltrados.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Botão de Filtro (Mobile) - Sempre visível no mobile */}
      <button
        onClick={() => setShowFiltersMobile(!showFiltersMobile)}
        className="lg:hidden w-full mb-6 flex items-center justify-center gap-2 py-3 bg-surface-container rounded-lg font-bold text-[#1541FC] border border-[#1541FC]/20"
      >
        {showFiltersMobile ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
        {showFiltersMobile ? "Fechar Filtros" : "Ver Categorias"}
      </button>

      <div className="flex flex-col lg:flex-row gap-gutter">

        {/* ── Sidebar ── */}
        <aside 
          aria-label="Categorias de sacolas" 
          className={cn(
            "w-full lg:w-56 flex-shrink-0",
            !showFiltersMobile && "hidden lg:block"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/produtos"
              className="font-label-md text-label-md text-on-surface uppercase tracking-wider flex items-center gap-2 hover:text-primary transition-colors group"
            >
              <ShoppingBag className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              Categorias
            </Link>
          </div>
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                onClick={() => selecionar(null)}
                className={`w-full text-left py-2 px-3 rounded-lg font-body-md text-body-md transition-colors ${
                  !categoriaAtiva
                    ? "bg-primary text-white font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                Ver Tudo
                <span className="ml-2 text-xs opacity-60">({SACOLAS_CATALOG.length})</span>
              </button>
            </li>
            {CATEGORIAS.map((cat) => {
              const count = SACOLAS_CATALOG.filter((p) => p.category === cat).length;
              const active = categoriaAtiva === cat;
              return (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => selecionar(cat)}
                    className={`w-full text-left py-2 px-3 rounded-lg font-body-md text-body-md transition-colors ${
                      active
                        ? "bg-primary text-white font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    {cat}
                    <span className="ml-2 text-xs opacity-60">({count})</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── Grid de produtos ── */}
        <div className="flex-1">
          {produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
              <ShoppingBag className="w-12 h-12 mb-4 opacity-30" />
              <p className="font-headline-sm">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-element-gap">
              {produtosFiltrados.map((p) => (
                <ProductCard key={p.id} product={p} imageLoading="lazy" linkToDetail={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
