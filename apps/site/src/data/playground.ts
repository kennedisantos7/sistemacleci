import { type Product } from "../components/ui/ProductCard";

const IMG = "https://i.imgur.com/XQkxrrs.png";

// ---------------------------------------------------------------------------
// Slugs para cada categoria de playground (usados na URL)
// ---------------------------------------------------------------------------
export const PLAYGROUND_SLUGS: Record<string, string> = {
  "grama-sintetica": "GRAMA SINTÉTICA",
};

// ---------------------------------------------------------------------------
// Catálogo completo
// ---------------------------------------------------------------------------
export const PLAYGROUND_CATALOG: Product[] = [

  // ── GRAMA SINTÉTICA ───────────────────────────────────────────────────────
  {
    id: "pg-01",
    title: "GRAMA SINTÉTICA",
    category: "GRAMA SINTÉTICA",
    image: "https://imgur.com/nIkEq2W.png",
    codes: ["9182", "9183", "9184"],
    sizes: ["12mm", "20mm", "30mm"],
    description: "Grama Sintética: um revestimento versátil e de baixa manutenção que dispensa o uso de água, mantendo-se sempre verde e com tom uniforme. Ideal para paisagismo, áreas de lazer, playgrounds, piscinas, campos esportivos, varandas, sacadas e até mesmo decoração de paredes. Destaca-se pela alta resistência ao sol e às intempéries da natureza, além de ser imune a insetos. Pode ser lavada facilmente para manutenção da limpeza.",
  },
];
