"use client";

import { ChevronDown, Home, Search, LayoutGrid, Menu, X, LogIn, UserRound } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { useAccount, firstName } from "../../lib/use-account";
import WhatsAppIcon from "../ui/WhatsAppIcon";
import { SACOLAS_CATALOG } from "../../data/sacolas";
import { TAPETES_CATALOG } from "../../data/tapetes";
import { GRAFICA_CATALOG } from "../../data/grafica";
import { COMUNICACAO_VISUAL_CATALOG } from "../../data/comunicacao-visual";
import { PLAYGROUND_CATALOG } from "../../data/playground";
import { SEGURANCA_CATALOG } from "../../data/seguranca";
import { MESAS_FREEZERS_CATALOG } from "../../data/mesas-freezers";

// Funções auxiliares para pegar a primeira imagem de uma categoria
const getImg = (catalog: any[], category: string, fallback: string) => {
  const item = catalog.find(p => p.category === category);
  return item?.image || fallback;
};


// ---------------------------------------------------------------------------
// Dados estáticos fora do componente: evita recriar arrays a cada render
// ---------------------------------------------------------------------------
const NAV_LINKS = [
  { name: "SACOLAS", path: "/sacolas" },
  { name: "TAPETES", path: "/tapetes" },
  { name: "GRÁFICA", path: "/grafica" },
  { name: "COMUNICAÇÃO VISUAL", path: "/comunicacao-visual" },
  { name: "SEGURANÇA", path: "/seguranca" },
  { name: "PLAYGROUND", path: "/playground" },
  { name: "MESAS", path: "/mesas-e-freezers" },
] as const;

const MEGA_MENU_CONTENT: Record<string, any[]> = {
  "SACOLAS": [
    { name: "Ver Tudo", isIcon: true, link: "/sacolas", icon: LayoutGrid },
    { name: "ALÇA BOCA DE PALHAÇO",  image: getImg(SACOLAS_CATALOG, "ALÇA BOCA DE PALHAÇO", "https://i.imgur.com/vmZe1ng.png"), link: "/sacolas?tipo=boca-palhaco" },
    { name: "ALÇA CAMISETA",         image: getImg(SACOLAS_CATALOG, "ALÇA CAMISETA", "https://i.imgur.com/vmZe1ng.png"), link: "/sacolas?tipo=alca-camiseta" },
    { name: "PAPEL",                 image: getImg(SACOLAS_CATALOG, "PAPEL", "https://i.imgur.com/vmZe1ng.png"), link: "/sacolas?tipo=papel" },
    { name: "ALÇA FITA",             image: getImg(SACOLAS_CATALOG, "ALÇA FITA", "https://i.imgur.com/vmZe1ng.png"), link: "/sacolas?tipo=alca-fita" },
    { name: "KRAFT",                 image: getImg(SACOLAS_CATALOG, "KRAFT", "https://i.imgur.com/vmZe1ng.png"), link: "/sacolas?tipo=kraft" },
    { name: "TNT",                   image: getImg(SACOLAS_CATALOG, "TNT", "https://i.imgur.com/vmZe1ng.png"), link: "/sacolas?tipo=tnt" },
  ],
  "TAPETES": [
    { name: "Ver Tudo",          isIcon: true,                                                                              link: "/tapetes",                    icon: LayoutGrid },
    { name: "MASTER",           image: getImg(TAPETES_CATALOG, "MASTER",           "https://i.imgur.com/qRhFc5i.png"),    link: "/tapetes?tipo=master" },
    { name: "NAYCLECI",         image: getImg(TAPETES_CATALOG, "NAYCLECI",         "https://i.imgur.com/nC96zji.png"),    link: "/tapetes?tipo=naycleci" },
    { name: "GOLD",             image: getImg(TAPETES_CATALOG, "GOLD",             "https://i.imgur.com/TE878Lg.png"),    link: "/tapetes?tipo=gold" },
    { name: "14MM",             image: getImg(TAPETES_CATALOG, "14MM",             "https://i.imgur.com/BkIXrNW.png"),    link: "/tapetes?tipo=14mm" },
    { name: "CLEANCLECI",       image: getImg(TAPETES_CATALOG, "CLEANCLECI",       "https://i.imgur.com/NACW9j9.png"),      link: "/tapetes?tipo=cleancleci" },
    { name: "MAXCLECI",         image: getImg(TAPETES_CATALOG, "MAXCLECI",         "https://i.imgur.com/UdATGJD.png"),    link: "/tapetes?tipo=maxcleci" },
    { name: "DUOCLECI",         image: getImg(TAPETES_CATALOG, "DUOCLECI",         "https://i.imgur.com/436O4rh.png"),    link: "/tapetes?tipo=duocleci" },
    { name: "VEÍCULOS",         image: getImg(TAPETES_CATALOG, "VEÍCULOS",         "https://i.imgur.com/gfNOj5v.png"),    link: "/tapetes?tipo=veiculos" },
    { name: "TAPETES SECANTES", image: getImg(TAPETES_CATALOG, "TAPETES SECANTES", "https://i.imgur.com/fEHD7jk.png"),   link: "/tapetes?tipo=tapete-secantes" },
  ],
  "GRÁFICA": [
    { name: "Ver Tudo", isIcon: true, link: "/grafica", icon: LayoutGrid },
    { name: "CARTÃO DE VISITA", image: getImg(GRAFICA_CATALOG, "CARTÃO DE VISITA", "https://i.imgur.com/YfUU19K.png"), link: "/grafica?tipo=cartao-de-visita" },
    { name: "PANFLETOS",        image: getImg(GRAFICA_CATALOG, "PANFLETOS", "https://i.imgur.com/YfUU19K.png"), link: "/grafica?tipo=panfletos" },
    { name: "ACESSÓRIOS",       image: getImg(GRAFICA_CATALOG, "ACESSÓRIOS", "https://i.imgur.com/YfUU19K.png"), link: "/grafica?tipo=escritorio" },
  ],
  "COMUNICAÇÃO VISUAL": [
    { name: "Ver Tudo", isIcon: true, link: "/comunicacao-visual", icon: LayoutGrid },
    { name: "WIND BANNERS",    image: getImg(COMUNICACAO_VISUAL_CATALOG, "WIND BANNERS", "https://i.imgur.com/nMe19zi.png"), link: "/comunicacao-visual?tipo=wind-banners" },
    { name: "BANDEIRAS",       image: getImg(COMUNICACAO_VISUAL_CATALOG, "BANDEIRAS", "https://i.imgur.com/nMe19zi.png"), link: "/comunicacao-visual?tipo=bandeiras" },
    { name: "LONAS E BANNERS", image: getImg(COMUNICACAO_VISUAL_CATALOG, "LONAS E BANNERS", "https://i.imgur.com/nMe19zi.png"), link: "/comunicacao-visual?tipo=lonas-banners" },
    { name: "ACESSÓRIOS",      image: getImg(COMUNICACAO_VISUAL_CATALOG, "ACESSÓRIOS", "https://i.imgur.com/nMe19zi.png"), link: "/comunicacao-visual?tipo=acessorios" },
    { name: "CAIXA DE PIZZA",  image: getImg(COMUNICACAO_VISUAL_CATALOG, "CAIXA DE PIZZA", "https://i.imgur.com/nMe19zi.png"), link: "/comunicacao-visual?tipo=caixa-pizza" },
  ],
  "PLAYGROUND": [
    { name: "Ver Tudo", isIcon: true, link: "/playground", icon: LayoutGrid },
    { name: "GRAMA SINTÉTICA", image: getImg(PLAYGROUND_CATALOG, "GRAMA SINTÉTICA", "https://i.imgur.com/XQkxrrs.png"), link: "/playground?tipo=grama-sintetica" },
  ],
  "SEGURANÇA": [
    { name: "Ver Tudo", isIcon: true, link: "/seguranca", icon: LayoutGrid },
    { name: "ANTIDERRAPANTES", image: getImg(SEGURANCA_CATALOG, "ANTIDERRAPANTES", "https://i.imgur.com/i5taW7t.png"), link: "/seguranca?tipo=antiderrapantes" },
    { name: "PISOS",           image: getImg(SEGURANCA_CATALOG, "PISOS", "https://i.imgur.com/i5taW7t.png"), link: "/seguranca?tipo=pisos" },
  ],
  "MESAS": [
    { name: "Ver Tudo", isIcon: true, link: "/mesas-e-freezers", icon: LayoutGrid },
    { name: "CAPA SOBREPOR",  image: getImg(MESAS_FREEZERS_CATALOG, "CAPA SOBREPOR", "https://i.imgur.com/KAFn9PI.png"), link: "/mesas-e-freezers?tipo=capa-sobrepor" },
    { name: "FORRO",          image: getImg(MESAS_FREEZERS_CATALOG, "FORRO", "https://i.imgur.com/KAFn9PI.png"), link: "/mesas-e-freezers?tipo=forro" },
    { name: "JOGO AMERICANO", image: getImg(MESAS_FREEZERS_CATALOG, "JOGO AMERICANO", "https://i.imgur.com/KAFn9PI.png"), link: "/mesas-e-freezers?tipo=jogo-americano" },
  ]
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
// URL do sistema (painel). Embutida no build via NEXT_PUBLIC_SISTEMA_URL.
const PAINEL_URL = process.env.NEXT_PUBLIC_SISTEMA_URL ?? "http://localhost:3001";

export default function Header() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const account = useAccount();
  const isLogged = account?.loggedIn === true;
  const loginUrl = `${PAINEL_URL}/login`;
  const accountUrl = `${PAINEL_URL}${account?.home ?? ""}`;
  const accountLabel = firstName(account?.name) ?? "Minha conta";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSubMenu = (name: string) => {
    setOpenSubMenu(openSubMenu === name ? null : name);
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/produtos?q=${encodeURIComponent(q)}`);
    setSearchQuery("");
    setIsMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <header className="w-full flex flex-col bg-white sticky top-0 z-50 shadow-sm">

      {/* ── Top Bar Informativa ── */}
      <div className="w-full bg-gray-50 border-b border-gray-100 py-1 hidden md:block">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] text-gray-500 font-medium">
          <div className="flex gap-4 uppercase tracking-wider">
            <span><strong className="text-gray-700">Razão Social:</strong> CLECI PERSONALIZA LTDA</span>
            <span className="text-gray-300">|</span>
            <span><strong className="text-gray-700">CNPJ:</strong> 28.402.051/0001-69</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><strong className="text-gray-700">Tel:</strong> (63) 9 9234-9085</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1"><strong className="text-gray-700">Email:</strong> clecipersonaliza@gmail.com</span>
          </div>
        </div>
      </div>

      {/* ── Barra superior ── */}
      <div className="w-full border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-1">
          <div className="grid grid-cols-3 items-center md:flex md:justify-between gap-4">
            
            {/* Mobile: Botão Menu */}
            <button 
              className="md:hidden text-[#1541FC] justify-self-start"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </button>

            {/* Logo */}
            <Link href="/" aria-label="Ir para a página inicial" className="flex-shrink-0 group justify-self-center">
              <div className="w-[80px] md:w-[100px] h-auto transform group-hover:scale-105 transition-transform flex items-center justify-center">
                <img 
                  src="/icons/logotipo.jpg" 
                  alt="Cleci Personaliza Logotipo" 
                  className="w-full h-auto object-contain"
                  width={100}
                  height={60}
                />
              </div>
            </Link>

            {/* Busca (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-4xl relative mx-4">
              <label htmlFor="header-search-desktop" className="sr-only">Buscar produtos</label>
              <input
                id="header-search-desktop"
                type="search"
                placeholder="Buscar Produtos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full py-1.5 pl-6 pr-14 rounded-full border border-[#1541FC] focus:border-[#1034D3] focus:ring-1 focus:ring-[#1034D3] outline-none text-[#555] placeholder-[#999] bg-transparent text-sm transition-all"
              />
              <button
                type="button"
                onClick={handleSearch}
                aria-label="Pesquisar"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1034D3] hover:opacity-75 transition-opacity"
              >
                <Search className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>

            {/* Ações (Sempre no canto) */}
            <div className="flex items-center gap-3 md:gap-5 text-[#1541FC] flex-shrink-0 justify-self-end">
              <a
                href="https://wa.me/556392349085"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Atendimento pelo WhatsApp"
                className="hover:text-[#1034D3] transition-colors hover:scale-110 transform"
              >
                <WhatsAppIcon className="w-7 h-7" />
              </a>
              {/* Acesso ao painel (vendedor/afiliado/admin). Quando há sessão
                  ativa no painel, vira um atalho para a conta. */}
              {isLogged ? (
                <a
                  href={accountUrl}
                  aria-label="Acessar minha conta"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#1541FC] bg-[#1541FC] px-3 py-1.5 text-xs md:text-sm font-bold text-white hover:bg-[#1034D3] transition-colors"
                >
                  <UserRound className="h-4 w-4" />
                  <span className="hidden sm:inline">{accountLabel}</span>
                </a>
              ) : (
                <a
                  href={loginUrl}
                  aria-label="Entrar no painel"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#1541FC] px-3 py-1.5 text-xs md:text-sm font-bold hover:bg-[#1541FC] hover:text-white transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </a>
              )}
            </div>
          </div>

          {/* Busca (Mobile) */}
          <div className="mt-3 md:hidden relative">
            <label htmlFor="header-search-mobile" className="sr-only">Buscar produtos</label>
            <input
              id="header-search-mobile"
              type="search"
              placeholder="Buscar Produtos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full py-2 pl-6 pr-14 rounded-full border border-[#1541FC] focus:border-[#1034D3] focus:ring-1 focus:ring-[#1034D3] outline-none text-[#555] placeholder-[#999] bg-transparent text-sm transition-all"
            />
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Pesquisar"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1034D3] hover:opacity-75 transition-opacity"
            >
              <Search className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Navegação inferior (Desktop) ── */}
      <div className="hidden md:block relative w-full border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto hide-scrollbar">
          <nav
            aria-label="Categorias Desktop"
            className="flex items-center justify-center min-w-max text-[13px] font-bold text-[#333] tracking-wider"
          >
            {/* Início */}
            <Link
              href="/"
              className="flex items-center gap-2 py-2 px-6 hover:text-[#1541FC] transition-colors border-r border-gray-200 relative group"
            >
              <Home className="w-[18px] h-[18px] text-[#1541FC]" strokeWidth={2.5} />
              INÍCIO
            </Link>

            {/* Links com dropdown */}
            {NAV_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.path);
              return (
                <div 
                  key={link.path} 
                  className="flex-shrink-0"
                  onMouseEnter={() => setHoveredMenu(link.name)}
                  onMouseLeave={() => setHoveredMenu(null)}
                >
                  <Link
                    href={link.path}
                    onClick={() => setHoveredMenu(null)}
                    className={cn(
                      "flex items-center gap-1.5 py-2 px-6 hover:text-[#1541FC] transition-colors border-r border-gray-200 h-full",
                      isActive ? "text-[#1541FC]" : "text-[#333]"
                    )}
                  >
                    {link.name}
                    <ChevronDown className="w-4 h-4 ml-0.5 text-black" strokeWidth={2.5} />
                  </Link>

                  {/* Mega Menu */}
                  <div className={cn(
                    "absolute left-1/2 -translate-x-1/2 top-full w-full max-w-[1100px] transition-all duration-300 z-50",
                    hoveredMenu === link.name ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"
                  )}>
                    <div className="bg-[#1541FC] shadow-2xl w-full p-10 rounded-b-xl border-x-2 border-b-2 border-white/20">
                      <h3 className="text-white font-black text-2xl mb-8 uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-white/30"></span>
                        {link.name}
                      </h3>
                      
                      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-4 py-2">
                        {(MEGA_MENU_CONTENT[link.name] || []).map((item) => (
                          <Link
                            key={item.name}
                            href={item.link}
                            onClick={() => setHoveredMenu(null)}
                            className="flex flex-col items-center gap-1.5 group/item transition-transform hover:-translate-y-1 py-1"
                          >
                            <div className="rounded-full bg-white/10 flex items-center justify-center p-1 overflow-hidden hover:scale-110 transition-transform duration-300 shadow-lg border border-white/10 relative w-[80px] h-[80px]">
                              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                              {item.isIcon ? (
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#1541FC]">
                                  <item.icon className="w-8 h-8" strokeWidth={2.5} />
                                </div>
                              ) : (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  width={80}
                                  height={80}
                                  loading="lazy"
                                  className="w-full h-full rounded-full object-cover"
                                />
                              )}
                            </div>
                            <span className="text-white font-bold text-center w-full group-hover/item:text-white/80 transition-colors leading-tight px-1 flex items-center justify-center overflow-hidden text-[13px] h-[36px]">
                              {item.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Menu Vertical Mobile ── */}
      <div className={cn(
        "fixed inset-0 bg-black/50 z-[60] md:hidden transition-opacity duration-300",
        isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )} onClick={toggleMenu}>
        <div 
          className={cn(
            "w-[280px] h-full bg-white transition-transform duration-300 ease-in-out overflow-y-auto",
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <span className="font-bold text-[#1541FC]">MENU</span>
            <button onClick={toggleMenu}><X className="w-6 h-6 text-[#333]" /></button>
          </div>

          <nav className="p-4 flex flex-col gap-1">
            {isLogged ? (
              <a
                href={accountUrl}
                className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-[#1541FC] p-3 font-bold text-white"
              >
                <UserRound className="w-5 h-5" />
                {accountLabel === "Minha conta" ? "Minha conta" : `Conta de ${accountLabel}`}
              </a>
            ) : (
              <a
                href={loginUrl}
                className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-[#1541FC] p-3 font-bold text-white"
              >
                <LogIn className="w-5 h-5" />
                Entrar no painel
              </a>
            )}
            <Link
              href="/"
              onClick={toggleMenu}
              className="flex items-center gap-3 p-3 font-bold text-[#333] hover:bg-gray-50 rounded-lg"
            >
              <Home className="w-5 h-5 text-[#1541FC]" />
              INÍCIO
            </Link>

            {NAV_LINKS.map((link) => (
              <div key={link.path}>
                <div className="flex items-center justify-between p-3 font-bold text-[#333] hover:bg-gray-50 rounded-lg">
                  <Link href={link.path} onClick={toggleMenu} className="flex-1 uppercase">
                    {link.name}
                  </Link>
                  <button 
                    onClick={() => toggleSubMenu(link.name)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <ChevronDown className={cn(
                      "w-5 h-5 transition-transform",
                      openSubMenu === link.name && "rotate-180"
                    )} />
                  </button>
                </div>

                {/* Submenu Mobile */}
                {openSubMenu === link.name && (
                  <div className="pl-6 pr-2 py-2 flex flex-col gap-2 bg-gray-50/50 rounded-b-lg">
                    {(MEGA_MENU_CONTENT[link.name] || []).map((item) => (
                      <Link
                        key={item.name}
                        href={item.link}
                        onClick={toggleMenu}
                        className="text-sm py-2 px-3 text-[#555] hover:text-[#1541FC] border-l-2 border-transparent hover:border-[#1541FC] transition-all"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
      {/* Nota: .hide-scrollbar está em index.css — sem <style> inline */}
    </header>
  );
}
