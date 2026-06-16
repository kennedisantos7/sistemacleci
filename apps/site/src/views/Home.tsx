"use client";

import { ArrowRight, ShieldCheck, Truck, Quote, Star, StarHalf } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import HeroCarousel from "../components/ui/HeroCarousel";
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

      {/* ── Novidades ── */}
      <section aria-labelledby="novidades-title" className="w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter mb-section-gap">
        <div className="flex items-end justify-between mb-12 border-b border-surface-variant pb-4">
          <div>
            <h2 id="novidades-title" className="font-headline-md text-headline-md text-on-background">Novidades</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">As últimas criações do nosso estúdio de design.</p>
          </div>
          <Link href="/produtos" className="font-label-md text-label-md text-secondary hover:underline hidden md:flex items-center gap-1">
            Ver todas as novidades <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {novidades.map((product) => (
            <ProductCard key={product.id} product={product} imageLoading="lazy" />
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
          <div className="md:col-span-2 relative rounded-xl overflow-hidden group bg-surface-container-low flex items-center justify-center min-h-[300px]">
            <img
              alt="Fachada da loja Cleci Personalizados"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src="https://i.imgur.com/JU9LBwl.jpeg"
              loading="lazy"
              decoding="async"
              width={900}
              height={500}
            />
          </div>

          {/* Mini cards de benefícios */}
          <div className="flex flex-col gap-6">
            {/* Card 1: Frete Grátis */}
            <div className="flex-1 bg-primary-fixed rounded-xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-all duration-300 border border-primary/10 group">
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
            <div className="flex-1 bg-surface-container-lowest rounded-xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-all duration-300 border border-outline-variant/30 group">
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
        </div>
      </section>

      {/* ── Mais Vendidos ── */}
      <section aria-labelledby="mais-vendidos-title" className="w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter mb-section-gap">
        <div className="text-center mb-12">
          <h2 id="mais-vendidos-title" className="font-headline-md text-headline-md text-on-background">Mais Vendidos</h2>
          <div className="w-16 h-1 bg-secondary mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Destaque Top #1 */}
          <div className="md:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant p-8 flex flex-col hover:shadow-[0_10px_40px_-10px_rgba(21,65,252,0.1)] transition-shadow">
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
                className="bg-[#25D366] text-white font-label-md text-label-md px-6 py-3 rounded-DEFAULT hover:bg-[#1DA851] transition-colors block text-center w-full max-w-xs"
              >
                Fazer Pedido
              </Link>
            </div>
          </div>

          {/* Lista secundária */}
          <div className="md:col-span-7 flex flex-col gap-6">
            {maisVendidos.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:items-center hover:shadow-[0_5px_20px_-5px_rgba(21,65,252,0.05)] transition-shadow gap-4 sm:gap-0">
                <div className="flex items-center gap-4 sm:mr-6 flex-grow">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface-container-low rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline-variant/30">
                    <img
                      alt={item.title}
                      className="max-h-full object-contain p-1"
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
                  className="w-full sm:w-auto bg-[#25D366] text-white px-6 sm:px-4 py-3 sm:py-2 rounded-lg sm:rounded-full font-label-md text-sm flex items-center justify-center hover:bg-[#1DA851] transition-colors shrink-0 shadow-sm"
                >
                  Fazer Pedido
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section aria-labelledby="depoimentos-title" className="w-full bg-surface py-section-gap mb-section-gap">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
          <div className="text-center mb-12">
            <h2 id="depoimentos-title" className="font-headline-md text-headline-md text-on-background">O que dizem nossos clientes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {DEPOIMENTOS.map((test, i) => (
              <article key={i} className="bg-surface-container-lowest p-8 rounded-xl border border-surface-variant relative">
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
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
