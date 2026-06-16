"use client";

import { ArrowRight, ShieldCheck, Truck, Quote, Star, StarHalf, Sparkles, Clock, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import HeroCarousel from "../components/ui/HeroCarousel";
import Reveal from "../components/ui/Reveal";
import ProductCard, { type Product } from "../components/ui/ProductCard";

// Importar todos os catálogos para compor a vitrine dinâmica
import { TAPETES_CATALOG } from "../data/tapetes";
import { GRAFICA_CATALOG } from "../data/grafica";
import { SACOLAS_CATALOG } from "../data/sacolas";
import { PLAYGROUND_CATALOG } from "../data/playground";
import { MESAS_FREEZERS_CATALOG } from "../data/mesas-freezers";
import { SEGURANCA_CATALOG } from "../data/seguranca";
import { COMUNICACAO_VISUAL_CATALOG } from "../data/comunicacao-visual";

const ALL_PRODUCTS: Product[] = [
  ...TAPETES_CATALOG,
  ...GRAFICA_CATALOG,
  ...SACOLAS_CATALOG,
  ...PLAYGROUND_CATALOG,
  ...MESAS_FREEZERS_CATALOG,
  ...SEGURANCA_CATALOG,
  ...COMUNICACAO_VISUAL_CATALOG,
];

// Helper para embaralhar array
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const DEPOIMENTOS = [
  {
    text: `"As sacolas personalizadas ficaram excelentes. A impressão é nítida e o material é de alta qualidade. Com certeza voltaremos a fazer negócio!"`,
    name: "Carlos A.", loc: "Palmas, TO", initial: "C", rating: 5,
  },
  {
    text: `"O playground que instalamos no condomínio superou as expectativas. Muito seguro e bem acabado. Equipe técnica muito atenciosa."`,
    name: "Marta R.", loc: "Gurupi, TO", initial: "M", rating: 5,
  },
  {
    text: `"Excelente atendimento na parte gráfica. Os cartões de visita e banners chegaram impecáveis e no prazo combinado."`,
    name: "João P.", loc: "Porto Nacional, TO", initial: "J", rating: 5,
  },
];

const TRUST_ITEMS = [
  { icon: Truck, title: "Frete grátis", desc: "Porto Nacional e Palmas" },
  { icon: MapPin, title: "Entrega Brasil", desc: "Enviamos para todo o país" },
  { icon: ShieldCheck, title: "Qualidade premium", desc: "Acabamento que dura" },
  { icon: Clock, title: "Atendimento ágil", desc: "Resposta rápida no WhatsApp" },
];

type Showcase = { novidades: Product[]; top1: Product; maisVendidos: Product[] };

const deterministicPicks = (): Showcase => ({
  novidades: ALL_PRODUCTS.slice(0, 4),
  top1: ALL_PRODUCTS[4],
  maisVendidos: ALL_PRODUCTS.slice(5, 8),
});

export default function Home() {
  // SSR e primeira pintura usam uma seleção determinística (evita hydration
  // mismatch); após montar, embaralhamos para dar variedade à vitrine.
  const [{ novidades, top1, maisVendidos }, setPicks] = useState<Showcase>(deterministicPicks);

  useEffect(() => {
    const shuffled = shuffle(ALL_PRODUCTS);
    setPicks({
      novidades: shuffled.slice(0, 4),
      top1: shuffled[4],
      maisVendidos: shuffled.slice(5, 8),
    });
  }, []);

  return (
    <div className="w-full">

      {/* ── Hero ── */}
      <HeroCarousel />

      {/* ── Faixa de confiança ── */}
      <section aria-label="Por que comprar na Cleci" className="w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter -mt-2 mb-section-gap">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {TRUST_ITEMS.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08}>
              <div className="group h-full flex items-center gap-3 md:gap-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <div className="shrink-0 bg-primary/10 text-primary rounded-lg p-2.5 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-on-background text-sm md:text-base leading-tight">{item.title}</p>
                  <p className="text-xs md:text-sm text-on-surface-variant leading-tight">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Novidades ── */}
      <section aria-labelledby="novidades-title" className="w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter mb-section-gap">
        <Reveal>
          <div className="flex items-end justify-between mb-12 border-b border-surface-variant pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-secondary font-label-md text-[11px] uppercase tracking-[0.18em] mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Novidades
              </span>
              <h2 id="novidades-title" className="font-headline-md text-headline-md text-on-background">As últimas criações</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Direto do nosso estúdio de design.</p>
            </div>
            <Link href="/produtos" className="font-label-md text-label-md text-secondary link-underline hidden md:flex items-center gap-1 group">
              Ver todas <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {novidades.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.08} className="h-full">
              <ProductCard product={product} imageLoading="lazy" />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/produtos" className="inline-block bg-surface-container border border-outline font-label-md text-label-md text-on-surface px-6 py-3 rounded-DEFAULT hover:bg-surface-variant transition-colors">
            Ver todas as novidades
          </Link>
        </div>
      </section>

      {/* ── Bento Grid Destaques ── */}
      <section aria-label="A Arte da Personalização" className="w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter mb-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[500px]">
          {/* Destaque grande */}
          <Reveal direction="right" className="md:col-span-2 h-full">
          <div className="relative h-full rounded-xl overflow-hidden group bg-surface-container-low flex items-end justify-start min-h-[300px]">
            <img
              alt="Fachada da loja Cleci Personalizados"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src="https://i.imgur.com/JU9LBwl.jpeg"
              loading="lazy"
              decoding="async"
              width={900}
              height={500}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />
            <div className="relative z-10 p-6 md:p-8 text-white">
              <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border border-white/30">A Arte da Personalização</span>
              <h3 className="font-headline-md text-2xl md:text-3xl font-black leading-tight max-w-md">Da ideia ao produto, do nosso jeito</h3>
            </div>
          </div>
          </Reveal>

          {/* Mini cards de benefícios */}
          <Reveal direction="left" className="h-full">
          <div className="flex flex-col gap-6 h-full">
            {/* Card 1: Frete Grátis */}
            <div className="hover-lift flex-1 bg-primary-fixed rounded-xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-all duration-300 border border-primary/10 group">
              <div className="flex items-start justify-between">
                <div className="bg-white/80 p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Truck className="text-primary w-8 h-8" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Exclusivo
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-headline-sm text-headline-sm text-on-primary-fixed mb-1 font-bold">Frete Grátis</h3>
                <p className="font-body-md text-body-md text-on-primary-fixed/80 leading-snug">Em Porto Nacional e Palmas</p>
              </div>
            </div>

            {/* Card 2: Qualidade Cleci */}
            <div className="hover-lift flex-1 bg-surface-container-lowest rounded-xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-all duration-300 border border-outline-variant/30 group">
              <div className="flex items-start justify-between">
                <div className="bg-primary/5 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="text-primary w-8 h-8" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-variant px-2.5 py-1 rounded-full">
                  Garantia
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-headline-sm text-headline-sm text-on-background mb-1 font-bold">Qualidade Cleci</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-snug">Personalização com durabilidade e acabamento premium</p>
              </div>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── Mais Vendidos ── */}
      <section aria-labelledby="mais-vendidos-title" className="w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter mb-section-gap">
        <Reveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-secondary font-label-md text-[11px] uppercase tracking-[0.18em] mb-2">
              <Star className="w-3.5 h-3.5 fill-current" /> Favoritos dos clientes
            </span>
            <h2 id="mais-vendidos-title" className="font-headline-md text-headline-md text-on-background">Mais Vendidos</h2>
            <div className="w-16 h-1 bg-secondary mx-auto mt-4 rounded-full" />
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Destaque Top #1 */}
          <Reveal direction="right" className="md:col-span-5">
          <div className="h-full bg-surface-container-lowest rounded-xl border border-outline-variant p-8 flex flex-col hover:shadow-[0_18px_50px_-12px_rgba(21,65,252,0.18)] hover:border-primary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-secondary text-on-secondary font-label-md text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">Top #1</span>
            </div>
            <div className="flex-grow flex items-center justify-center mb-8 min-h-[250px]">
              <img
                alt={top1.title}
                className="max-h-full object-contain"
                src={top1.image}
                loading="lazy"
                decoding="async"
                width={400}
                height={250}
              />
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-background mb-2">{top1.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6">{top1.description || "Produto de alta qualidade com personalização exclusiva para o seu negócio."}</p>
              <Link
                href={`/produto/${top1.id}`}
                className="group/btn bg-[#25D366] text-white font-label-md text-label-md px-6 py-3 rounded-DEFAULT hover:bg-[#1DA851] hover:shadow-lg hover:shadow-[#25D366]/30 transition-all duration-300 flex items-center justify-center gap-2 text-center w-full max-w-xs active:scale-[0.98]"
              >
                Fazer Pedido
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
          </Reveal>

          {/* Lista secundária */}
          <div className="md:col-span-7 flex flex-col gap-6">
            {maisVendidos.map((item, i) => (
              <Reveal key={i} delay={i * 0.1} direction="left">
              <div className="hover-lift flex flex-col sm:flex-row bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:items-center hover:shadow-[0_12px_30px_-10px_rgba(21,65,252,0.15)] hover:border-primary/30 gap-4 sm:gap-0">
                <div className="flex items-center gap-4 sm:mr-6 flex-grow">
                  <div className="group/img w-20 h-20 sm:w-24 sm:h-24 bg-surface-container-low rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline-variant/30">
                    <img
                      alt={item.title}
                      className="max-h-full object-contain p-1 transition-transform duration-500 group-hover/img:scale-110"
                      src={item.image}
                      loading="lazy"
                      decoding="async"
                      width={96}
                      height={96}
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-body-lg text-body-md sm:text-body-lg text-on-background font-bold sm:font-normal leading-tight">{item.title}</h4>
                  </div>
                </div>
                <Link
                  href={`/produto/${item.id}`}
                  className="group/btn w-full sm:w-auto bg-[#25D366] text-white px-6 sm:px-4 py-3 sm:py-2 rounded-lg sm:rounded-full font-label-md text-sm flex items-center justify-center gap-1.5 hover:bg-[#1DA851] transition-all duration-300 shrink-0 shadow-sm active:scale-[0.98]"
                >
                  Fazer Pedido
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section aria-labelledby="depoimentos-title" className="w-full bg-surface py-section-gap mb-section-gap">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
          <Reveal>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 text-secondary font-label-md text-[11px] uppercase tracking-[0.18em] mb-2">
                <Quote className="w-3.5 h-3.5" /> Depoimentos
              </span>
              <h2 id="depoimentos-title" className="font-headline-md text-headline-md text-on-background">O que dizem nossos clientes</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {DEPOIMENTOS.map((test, i) => (
              <Reveal key={i} delay={i * 0.1} className="h-full">
              <article className="hover-lift h-full bg-surface-container-lowest p-8 rounded-xl border border-surface-variant hover:border-primary/30 hover:shadow-lg relative">
                <Quote className="absolute top-6 right-6 text-primary-fixed w-10 h-10 rotate-180" aria-hidden="true" />
                <div className="flex text-primary mb-4" aria-label={`Avaliação: ${test.rating} estrelas`}>
                  {[...Array(Math.floor(test.rating))].map((_, idx) => (
                    <Star key={idx} className="w-5 h-5 fill-current text-primary" aria-hidden="true" />
                  ))}
                  {test.rating % 1 !== 0 && <StarHalf className="w-5 h-5 fill-current text-primary" aria-hidden="true" />}
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 relative z-10">{test.text}</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface font-headline-sm" aria-hidden="true">
                    {test.initial}
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-background">{test.name}</p>
                    <p className="text-xs text-on-surface-variant">{test.loc}</p>
                  </div>
                </div>
              </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section aria-labelledby="cta-title" className="w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter mb-section-gap">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1541FC] via-[#1843fd] to-[#FE0000] animate-gradient px-6 py-12 md:px-16 md:py-16 text-center shadow-2xl">
            {/* Brilhos decorativos */}
            <div className="pointer-events-none absolute -top-16 -left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-float" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-float-slow" aria-hidden="true" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/30 text-white text-[11px] font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Orçamento sem compromisso
              </span>
              <h2 id="cta-title" className="font-headline-lg text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                Vamos personalizar o seu projeto?
              </h2>
              <p className="font-body-lg text-white/90 mb-8 text-balance">
                Conte o que você precisa e a nossa equipe monta a solução ideal — com qualidade premium e entrega para todo o Brasil.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://wa.me/556392349085"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/cta w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#1541FC] font-bold px-8 py-4 rounded-DEFAULT shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar no WhatsApp
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-1" />
                </a>
                <Link
                  href="/produtos"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/60 text-white font-bold px-8 py-4 rounded-DEFAULT hover:bg-white/10 transition-colors"
                >
                  Ver catálogo completo
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
