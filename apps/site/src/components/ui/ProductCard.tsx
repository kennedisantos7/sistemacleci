import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCents } from "../../lib/format";
import AffiliateCopy from "../AffiliateCopy";

export type BorderOption = {
  name: string;
  image: string;
  code: string; // Código da borda (ex: 1017, 1018, 1019)
};

export interface Product {
  id: number | string;
  title: string;
  category: string;
  image: string;
  badge?: string | null;
  badgeColor?: string;
  sizes?: string[];
  borders?: BorderOption[]; // Opções de borda (tapetes)
  code?: string;       // Código de referência do produto
  codes?: string[];    // Lista de códigos para produtos agrupados
  description?: string; // Descrição curta (ex: dimensões)
  images?: string[];    // Galeria de imagens
  waLink?: string;
  priceCents?: number;  // Se definido, habilita o checkout online (Stripe)
}

interface ProductCardProps {
  product: Product;
  /** If true, renders a linked image block (used in grid pages). Default: true */
  linkToDetail?: boolean;
  /** Extra class for the card wrapper */
  className?: string;
  /** Image loading strategy. Use "eager" for above-the-fold cards. Default: "lazy" */
  imageLoading?: "lazy" | "eager";
}

export default function ProductCard({
  product,
  linkToDetail = true,
  className = "",
  imageLoading = "lazy",
}: ProductCardProps) {
  // linkToDetail mantido na API por compatibilidade; ambos os links levam ao detalhe.
  void linkToDetail;

  return (
    <article
      className={`group hover-lift bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden flex flex-col shadow-sm hover:shadow-[0_18px_50px_-12px_rgba(21,65,252,0.22)] hover:border-primary/40 h-full relative ${className}`}
    >
      <Link href={`/produto/${product.id}`} className="flex-grow flex flex-col">
        {/* Imagem */}
        <div className="relative h-[260px] bg-surface-container-low flex items-center justify-center overflow-hidden">
          {/* Brilho diagonal sutil ao passar o mouse */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-white/0 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img
            alt={product.title}
            src={product.image}
            width={300}
            height={260}
            loading={imageLoading}
            decoding="async"
            className="max-h-full object-contain transition-transform duration-[600ms] ease-out group-hover:scale-110 group-hover:-rotate-1"
          />
          {product.badge && (
            <span
              className={`absolute top-4 left-4 z-20 font-label-md text-[10px] px-2.5 py-1 rounded-full uppercase shadow-sm ${
                product.badgeColor ?? "bg-secondary text-on-secondary"
              }`}
            >
              {product.badge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col flex-grow border-t border-outline-variant/30">
          <span className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60 mb-1 font-bold">
            {product.category}
          </span>
          <h3 className="font-headline-sm text-xl text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          {product.priceCents ? (
            <span className="mt-auto pt-2 font-headline-sm text-lg text-primary font-bold">
              {formatCents(product.priceCents)}
            </span>
          ) : null}
        </div>
      </Link>

      {/* Botão de Pedido - Fora do Link principal para não dar conflito */}
      <div className="px-5 pb-5 mt-auto space-y-2">
        <Link
          href={`/produto/${product.id}`}
          className="group/btn w-full bg-[#25D366] text-white font-label-md text-label-md py-3 rounded-DEFAULT hover:bg-[#1DA851] hover:shadow-lg hover:shadow-[#25D366]/30 transition-all duration-300 text-center flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          Fazer Pedido
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Link>
        {/* Aparece só no modo afiliado */}
        <AffiliateCopy productId={product.id} />
      </div>
    </article>
  );
}
