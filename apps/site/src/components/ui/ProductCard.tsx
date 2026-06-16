import Link from "next/link";

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
      className={`group bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden flex flex-col hover:shadow-[0_10px_40px_-10px_rgba(21,65,252,0.12)] transition-shadow duration-300 h-full relative ${className}`}
    >
      <Link href={`/produto/${product.id}`} className="flex-grow flex flex-col">
        {/* Imagem */}
        <div className="relative h-[260px] bg-surface-container-low flex items-center justify-center overflow-hidden">
          <img
            alt={product.title}
            src={product.image}
            width={300}
            height={260}
            loading={imageLoading}
            decoding="async"
            className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
          {product.badge && (
            <span
              className={`absolute top-4 left-4 font-label-md text-[10px] px-2 py-1 rounded-full uppercase ${
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
        </div>
      </Link>

      {/* Botão de Pedido - Fora do Link principal para não dar conflito */}
      <div className="px-5 pb-5 mt-auto">
        <Link
          href={`/produto/${product.id}`}
          className="w-full bg-[#25D366] text-white font-label-md text-label-md py-3 rounded-DEFAULT hover:bg-[#1DA851] transition-colors text-center block"
        >
          Fazer Pedido
        </Link>
      </div>
    </article>
  );
}
