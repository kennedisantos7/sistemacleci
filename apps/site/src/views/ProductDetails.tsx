"use client";

import { ChevronRight, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { type BorderOption } from "../components/ui/ProductCard";
import BuyButton from "../components/BuyButton";
import AffiliateCopy from "../components/AffiliateCopy";
import { buildWaLink } from "../lib/whatsapp";
import { formatCents } from "../lib/format";
import { TAPETES_CATALOG } from "../data/tapetes";
import { GRAFICA_CATALOG } from "../data/grafica";
import { SACOLAS_CATALOG } from "../data/sacolas";
import { PLAYGROUND_CATALOG } from "../data/playground";
import { MESAS_FREEZERS_CATALOG } from "../data/mesas-freezers";
import { SEGURANCA_CATALOG } from "../data/seguranca";
import { COMUNICACAO_VISUAL_CATALOG } from "../data/comunicacao-visual";

const ALL_PRODUCTS = [
  ...TAPETES_CATALOG,
  ...GRAFICA_CATALOG,
  ...SACOLAS_CATALOG,
  ...PLAYGROUND_CATALOG,
  ...MESAS_FREEZERS_CATALOG,
  ...SEGURANCA_CATALOG,
  ...COMUNICACAO_VISUAL_CATALOG,
];

export default function ProductDetails() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const product = ALL_PRODUCTS.find((p) => String(p.id) === id);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [withInstallation, setWithInstallation] = useState(false);
  const [selectedBorder, setSelectedBorder] = useState<BorderOption | null>(null);
  // Pagamento online só fica disponível quando o cliente chega pelo link de
  // pagamento do afiliado (?pagar=1). No site normal, o fechamento é via WhatsApp.
  const [pagar, setPagar] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    setPagar(new URLSearchParams(window.location.search).get("pagar") === "1");
  }, []);

  useEffect(() => {
    if (product?.borders && product.borders.length > 0) {
      setSelectedBorder(product.borders[0]);
    } else if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
      setSelectedSizeIndex(0);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-on-background">Produto não encontrado</h1>
        <Link href="/produtos" className="text-primary hover:underline font-bold">Voltar para produtos</Link>
      </div>
    );
  }

  const handleSizeSelect = (size: string, index: number) => {
    setSelectedSize(size);
    setSelectedSizeIndex(index);
  };

  // Determinar o código exibido (se tiver múltiplos, pega o correspondente ao tamanho)
  const currentCode = product.codes && product.codes[selectedSizeIndex] 
    ? product.codes[selectedSizeIndex] 
    : product.code;

  // Título exibido no breadcrumb e no heading principal
  const displayName = product.title;

  // Helper: build WA link com nome completo e múltiplos códigos quando aplicável
  const buildLink = () => {
    let combinedCode = currentCode || "";
    if (selectedBorder) {
      combinedCode = currentCode 
        ? `${currentCode} / Borda: ${selectedBorder.code}` 
        : `Borda: ${selectedBorder.code}`;
    }
    
    return buildWaLink(
      product.borders ? `${product.category} ${product.title}` : product.title,
      { 
        category: product.category, 
        size: selectedBorder ? selectedBorder.name : (selectedSize || undefined), 
        code: combinedCode || undefined,
        withInstallation
      }
    );
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-outline-variant/30 py-4 mb-8">
        <div className="max-w-container-max mx-auto px-gutter md:px-gutter">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant font-body-md">
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/produtos" className="hover:text-primary transition-colors">Produtos</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-on-surface font-bold truncate max-w-[200px] md:max-w-none">{displayName}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-gutter mb-section-gap bg-white p-6 md:p-10 rounded-2xl border border-outline-variant shadow-sm">
          
          {/* Left Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="w-full aspect-square bg-surface-container-low rounded-xl overflow-hidden flex items-center justify-center p-8 border border-outline-variant/50">
              <img 
                alt={product.title} 
                className="w-full h-full object-contain drop-shadow-xl" 
                src={product.image}
              />
            </div>

            {/* Gallery Thumbnails - Only show if there are multiple images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, i) => (
                  <button 
                    key={i} 
                    className={`aspect-square bg-surface-container-lowest rounded-lg border p-2 flex items-center justify-center overflow-hidden transition-all ${img === product.image ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant hover:border-primary'}`}
                  >
                    <img alt={`Thumbnail ${i}`} className="w-full h-full object-contain" src={img}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Info */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex gap-2 mb-4">
              <span className="bg-primary/10 text-primary font-extrabold text-xs md:text-sm px-4 py-1.5 md:px-5 md:py-2 rounded-full uppercase tracking-widest border border-primary/20">{product.category}</span>
              {product.badge && (
                <span className="bg-secondary/10 text-secondary font-extrabold text-xs md:text-sm px-4 py-1.5 md:px-5 md:py-2 rounded-full uppercase tracking-widest border border-secondary/20">{product.badge}</span>
              )}
            </div>

            <h1 className="font-headline-md text-on-background mb-2 text-3xl md:text-4xl">{displayName}</h1>
            {(currentCode || selectedBorder) && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 font-mono text-sm text-on-surface-variant">
                {currentCode && (
                  <span>
                    {product.borders ? "Cód. Produto: " : "Cód: "}
                    <strong className="text-on-surface">{currentCode}</strong>
                  </span>
                )}
                {selectedBorder && (
                  <span>
                    Cód. Borda: <strong className="text-on-surface">{selectedBorder.code}</strong>
                  </span>
                )}
              </div>
            )}
            
            <p className="font-body-md text-on-surface-variant mb-8 border-b border-outline-variant/30 pb-8 leading-relaxed">
              {product.description || "Alta qualidade e personalização total para o seu negócio. Nossos produtos são fabricados com os melhores materiais do mercado, garantindo durabilidade e uma estética impecável para sua marca."}
            </p>

            <div className="flex flex-col gap-8 mb-10">
              {/* Seleção de Borda (Tapetes) */}
              {product.borders && product.borders.length > 0 && (
                <div className="flex flex-col gap-4">
                  <label className="font-bold text-on-background uppercase text-xs tracking-widest">
                    Tipo de Borda
                  </label>
                  <div className="flex flex-col gap-3">
                    {product.borders.map((border) => {
                      const isActive = selectedBorder?.name === border.name;
                      return (
                        <button
                          key={border.name}
                          type="button"
                          onClick={() => setSelectedBorder(border)}
                          className={`flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all ${
                            isActive
                              ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                              : "border-outline-variant bg-white hover:border-primary/50 hover:bg-surface-container-low"
                          }`}
                        >
                          {/* Miniatura da borda */}
                          <div className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                            isActive ? "border-primary" : "border-outline-variant/40"
                          }`}>
                            <img
                              src={border.image}
                              alt={border.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Nome */}
                          <div className="flex flex-col gap-0.5">
                            <span className={`font-bold text-sm uppercase tracking-wide transition-colors ${
                              isActive ? "text-primary" : "text-on-surface"
                            }`}>
                              {border.name}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">
                                Selecionada
                              </span>
                            )}
                          </div>
                          {/* Indicador */}
                          {isActive && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seleção de Tamanho (produtos sem bordas) */}
              {!product.borders && product.sizes && product.sizes.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center md:justify-between items-center">
                    <label className="font-bold text-on-background uppercase text-xs tracking-widest text-center md:text-left">Selecione o Tamanho</label>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {product.sizes.map((size, index) => (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size, index)}
                        type="button"
                        className={`min-w-[80px] md:min-w-[70px] px-4 h-[50px] flex items-center justify-center rounded-lg font-bold transition-all border-2 ${
                          selectedSize === size
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                            : "bg-white border-outline-variant text-on-surface hover:border-primary hover:text-primary"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Opção de Instalação (Apenas para Grama/Playground) */}
              {(product.category.toLowerCase().includes("grama") || product.category.toLowerCase().includes("playground")) && (
                <div className="flex flex-col gap-4 p-5 bg-surface-container-low rounded-xl border-2 border-primary/20 mb-8">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="installation-toggle"
                      checked={withInstallation}
                      onChange={(e) => setWithInstallation(e.target.checked)}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                    <label htmlFor="installation-toggle" className="font-bold text-on-background cursor-pointer select-none">
                      DESEJO O SERVIÇO DE INSTALAÇÃO
                    </label>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed italic">
                    *A instalação é um serviço opcional. Ao selecionar, informaremos o orçamento completo incluindo a mão de obra.
                  </p>
                </div>
              )}
            </div>

            {/* Actions Section */}
            <div className="flex flex-col gap-6 mt-auto">
              {/* Compra online: só via link de pagamento do afiliado (?pagar=1)
                  e quando o produto tem preço definido. */}
              {product.priceCents && pagar ? (
                <div className="flex flex-col gap-3 border-b border-outline-variant/30 pb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-md text-3xl text-on-background font-bold">
                      {formatCents(product.priceCents)}
                    </span>
                    <span className="text-xs text-on-surface-variant">à vista</span>
                  </div>
                  <BuyButton productId={product.id} />
                  <p className="text-xs text-on-surface-variant text-center">
                    Pagamento seguro via Stripe. Ou solicite um orçamento abaixo.
                  </p>
                </div>
              ) : null}

              {/* Botão para Desktop (Escondido no Mobile) */}
              <a
                href={buildLink()}
                suppressHydrationWarning
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex w-full bg-[#25D366] text-white font-bold py-5 px-8 rounded-xl uppercase tracking-widest justify-center items-center gap-3 hover:bg-[#1da851] transition-all shadow-xl shadow-green-500/20 active:scale-[0.98]"
              >
                Solicitar Orçamento
              </a>

              {/* Modo afiliado: copiar link deste produto */}
              <AffiliateCopy productId={product.id} />

              {/* Botão Fixo no Mobile (Bottom Bar) */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-outline-variant z-50 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
                <a
                  href={buildLink()}
                  suppressHydrationWarning
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full bg-[#25D366] text-white font-bold py-4 px-8 rounded-xl uppercase tracking-widest justify-center items-center gap-3 active:scale-[0.98]"
                >
                  Solicitar Orçamento
                </a>
              </div>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-20 md:mb-0">
                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col items-center text-center gap-2 border border-outline-variant/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-tighter">Entrega</span>
                    <span className="text-xs font-bold text-on-surface">Frete Rápido</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col items-center text-center gap-2 border border-outline-variant/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-tighter">Garantia</span>
                    <span className="text-xs font-bold text-on-surface">100% Seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
