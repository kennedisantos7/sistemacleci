import { useSearchParams, Link } from "react-router-dom";
import { ChevronRight, LayoutGrid, Filter, X } from "lucide-react";
import { useState } from "react";
import ProductCard from "../components/ui/ProductCard";
import { MESAS_FREEZERS_CATALOG, MESAS_FREEZERS_SLUGS } from "../data/mesas-freezers";
import { cn } from "../lib/utils";

// Categorias na ordem definida em MESAS_FREEZERS_SLUGS (única fonte de verdade)
const CATEGORIAS = Object.values(MESAS_FREEZERS_SLUGS);

const SLUG_TO_LABEL = MESAS_FREEZERS_SLUGS;

export default function MesasFreezers() {
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const filteredProducts = tipo && SLUG_TO_LABEL[tipo]
    ? MESAS_FREEZERS_CATALOG.filter(p => p.category === SLUG_TO_LABEL[tipo])
    : MESAS_FREEZERS_CATALOG;

  const currentCategoryLabel = tipo ? SLUG_TO_LABEL[tipo] : "Todos os Itens";

  return (
    <div className="bg-surface min-h-screen">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-outline-variant/30 py-4">
        <div className="max-w-container-max mx-auto px-gutter md:px-gutter">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant font-body-md">
            <Link to="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/produtos" className="hover:text-primary transition-colors">Produtos</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-on-surface font-bold">MESAS</span>
          </div>
        </div>
      </nav>

      <div className="max-w-container-max mx-auto px-gutter md:px-gutter py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar */}
          <aside className={cn(
            "w-full lg:w-64 flex-shrink-0",
            !showFiltersMobile && "hidden lg:block"
          )}>
            <Link 
              to="/produtos"
              className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors mb-8 group"
            >
              <h2 className="font-headline-sm uppercase tracking-tighter">Categorias</h2>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>
            
            <ul className="space-y-2">
              <li>
                <Link
                  to="/mesas-e-freezers"
                  onClick={() => setShowFiltersMobile(false)}
                  className={cn(
                    "flex items-center justify-between w-full text-left py-2 px-3 rounded-lg font-body-md text-body-md transition-colors",
                    !tipo ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    <span>Ver Todos</span>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    !tipo ? "bg-white/20" : "bg-surface-container-high opacity-60"
                  )}>
                    {MESAS_FREEZERS_CATALOG.length}
                  </span>
                </Link>
              </li>
              
              {CATEGORIAS.map((cat) => {
                const catSlug = Object.keys(SLUG_TO_LABEL).find(key => SLUG_TO_LABEL[key] === cat);
                const isActive = tipo === catSlug;
                const count = MESAS_FREEZERS_CATALOG.filter(p => p.category === cat).length;
                
                return (
                  <li key={cat}>
                    <Link
                      to={`/mesas-e-freezers?tipo=${catSlug}`}
                      onClick={() => setShowFiltersMobile(false)}
                      className={cn(
                        "flex items-center justify-between w-full text-left py-2 px-3 rounded-lg font-body-md text-body-md transition-colors",
                        isActive ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:bg-surface-container"
                      )}
                    >
                      <span>{cat}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        isActive ? "bg-white/20" : "bg-surface-container-high opacity-60"
                      )}>
                        {count}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Main Content */}
          <main className="flex-grow">
            {/* Botão de Filtro (Mobile) - Sempre visível no mobile */}
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="lg:hidden w-full mb-6 flex items-center justify-center gap-2 py-3 bg-surface-container rounded-lg font-bold text-[#1541FC] border border-[#1541FC]/20"
            >
              {showFiltersMobile ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
              {showFiltersMobile ? "Fechar Filtros" : "Ver Categorias"}
            </button>

            <header className={cn(
              "mb-10",
              !showFiltersMobile && "hidden lg:block"
            )}>
              <h1 className="font-headline-md text-on-background mb-2">
                MESAS: {currentCategoryLabel}
              </h1>
              <p className="text-on-surface-variant font-body-md">
                Capas e forros personalizados para proteção e padronização.
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-outline-variant/30">
                <p className="text-on-surface-variant font-body-md">Nenhum produto encontrado nesta categoria.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
