import { type Product } from "../components/ui/ProductCard";

const IMG = "https://i.imgur.com/KAFn9PI.png";

// ---------------------------------------------------------------------------
// Slugs para cada categoria de mesas (usados na URL)
// ---------------------------------------------------------------------------
export const MESAS_FREEZERS_SLUGS: Record<string, string> = {
  "capa-sobrepor":  "CAPA SOBREPOR",
  "forro":          "FORRO",
  "jogo-americano": "JOGO AMERICANO",
};

// ---------------------------------------------------------------------------
// Catálogo completo
// ---------------------------------------------------------------------------
export const MESAS_FREEZERS_CATALOG: Product[] = [

  // ── CAPA SOBREPOR ─────────────────────────────────────────────────────────
  {
    id: "mf-02",
    title: "CAPA DE MESA SOBREPOR COURINO",
    category: "CAPA SOBREPOR",
    image: "https://imgur.com/JTPFn9Z.png",
    codes: ["7162", "7166", "7165", "7164"],
    sizes: [
      "Lisa",
      "Personalizada com Laser",
      "Personalizada com Rebaixamento",
      "Personalizada com Tinta",
    ],
    description: "Capa de mesa de sobrepor em couro sintético: um acessório extremamente funcional, voltado para proteção e praticidade. Por ser produzida em material sintético, é 100% impermeável, protegendo a mesa contra derramamento de líquidos, arranhões, riscos e queimaduras. A versão personalizada é uma excelente ferramenta de marketing, fixando a marca na mente do cliente. Ideal para ambientes comerciais e residenciais, adaptando-se a qualquer tipo de mesa.",
  },

  // ── FORRO ─────────────────────────────────────────────────────────────────
  {
    id: "mf-03",
    title: "FORRO PARA MESA TECIDO OXFORD",
    category: "FORRO",
    image: "https://imgur.com/2hntGZi.png",
    codes: ["7169", "7170"],
    sizes: ["Personalizado", "Liso"],
    description: "Forro de mesa em tecido Oxford, disponível nas versões lisa ou personalizada. Serve tanto para proteção quanto para estética, sendo que a versão personalizada é uma excelente ferramenta de marketing para reforçar a divulgação da sua marca. Muito utilizado em restaurantes e eventos, torna o ambiente agradável, elegante e acolhedor, adaptando-se a estilos rústicos ou sofisticados.",
  },

  // ── JOGO AMERICANO ────────────────────────────────────────────────────────
  {
    id: "mf-04",
    title: "JOGO AMERICANO COURINO",
    category: "JOGO AMERICANO",
    image: "https://imgur.com/UWEumFl.png",
    codes: ["7175", "7176", "7177", "7178"],
    sizes: [
      "Liso",
      "Personalizado com Laser",
      "Personalizado com Baixo Relevo",
      "Personalizado com Tinta",
    ],
    description: "Jogo americano em couro sintético, ideal para proteger a superfície da mesa no local de pratos e utensílios. Além de organizar o lugar de cada convidado, é uma peça-chave na decoração, trazendo sofisticação e modernidade ao ambiente. Perfeito para uso diário tanto em residências quanto em estabelecimentos comerciais.",
  },
];
