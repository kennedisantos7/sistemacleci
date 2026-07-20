import { type Product } from "../components/ui/ProductCard";

const IMG = "https://i.imgur.com/YfUU19K.png";

// Para habilitar o checkout online (botão "Comprar agora") em um produto,
// adicione `priceCents` ao objeto (ex.: priceCents: 8990 => R$ 89,90).
// Requer Mercado Pago configurado no sistema. Sem isso, o produto fica só com orçamento.

// ---------------------------------------------------------------------------
// Slugs para cada categoria de gráfica (usados na URL)
// Ordem aqui define a ordem no sidebar
// ---------------------------------------------------------------------------
export const GRAFICA_SLUGS: Record<string, string> = {
  "cartao-de-visita": "CARTÃO DE VISITA",
  "panfletos":        "PANFLETOS",
  "escritorio":       "ACESSÓRIOS",
};

// ---------------------------------------------------------------------------
// Catálogo completo
// ---------------------------------------------------------------------------
export const GRAFICA_CATALOG: Product[] = [

  // ── CARTÃO DE VISITA ─────────────────────────────────────────────────────
  {
    id: "g-01",
    title: "CARTÃO DE VISITA",
    category: "CARTÃO DE VISITA",
    image: "https://imgur.com/1XvQuHB.png",
    description: "Cartão de Visita disponível em três modelos: Simples (colorido e laminado na frente), 4x4 Colorido (laminado em ambos os lados) e 4x4 Premium (com verniz localizado em ambos os lados). O cartão de visita facilita o compartilhamento de contatos, servindo como uma ferramenta essencial de marketing pessoal ou empresarial. Ele reforça a identidade da marca de forma memorável, transmitindo profissionalismo e elegância.",
    codes: ["8171", "8172", "8173"],
    sizes: ["Simples (4x1)", "Colorido 4x4", "Colorido + Verniz Localizado (4x4)"],
  },

  // ── PANFLETOS ─────────────────────────────────────────────────────────────
  {
    id: "g-04",
    title: "PANFLETOS",
    category: "PANFLETOS",
    image: "https://imgur.com/UfQGJCh.png",
    description: "Panfletos personalizados disponíveis em duas modalidades: impressão só frente ou frente e verso. São ferramentas de marketing ideais para divulgação rápida de produtos, serviços ou ideias, focando em alcance imediato com baixo investimento. Perfeitos para distribuição em locais de grande tráfego; um design atrativo garante a atenção de quem o recebe.",
    codes: ["8174", "8175"],
    sizes: ["15x20cm (Só Frente)", "15x20cm (Frente e Verso)"],
  },

  // ── ACESSÓRIOS ────────────────────────────────────────────────────────────
  {
    id: "g-06",
    title: "ENVELOPES",
    category: "ACESSÓRIOS",
    image: "https://imgur.com/KKbVSIR.png",
    description: "Envelopes personalizados, essenciais para o transporte seguro de documentos e outros materiais planos. Garantem a privacidade do conteúdo durante todo o trajeto até o destino final, sendo amplamente utilizados em malas diretas, correspondências oficiais e processos formais. Além da segurança, conferem profissionalismo e reforçam a identidade visual da sua marca.",
    code: "8183",
  },
  {
    id: "g-07",
    title: "PASTAS",
    category: "ACESSÓRIOS",
    image: "https://imgur.com/bGxvFAu.png",
    description: "Pastas de papel personalizadas, disponíveis em diversas configurações: com ou sem bolso, e com acabamento fosco ou laminado. São ferramentas essenciais para a organização, proteção e transporte de documentos, garantindo que cheguem ao destino intactos, limpos e organizados. Além da funcionalidade, transmitem profissionalismo e cuidado com a sua documentação.",
    codes: ["8176", "8177", "8178", "8170"],
    sizes: ["Com Bolso (Fosca)", "Sem Bolso (Fosca)", "Com Bolso (Laminada)", "Sem Bolso (Laminada)"],
  },
  {
    id: "g-08",
    title: "TAGS PARA BRINCO",
    category: "ACESSÓRIOS",
    image: "https://imgur.com/reI9r1X.png",
    description: "Tags (etiquetas) para brincos: essenciais para organizar, valorizar e promover peças delicadas. Facilitam o manuseio pelo cliente, agregando charme e elevando a percepção de valor do produto em vitrines e exposições.",
    code: "8190",
  },
  {
    id: "g-09",
    title: "ETIQUETAS",
    category: "ACESSÓRIOS",
    image: "https://imgur.com/29ifihF.png",
    description: "Etiquetas personalizadas para apresentação de produtos, exibição de preços e medidas, fortalecendo a divulgação da sua marca. Elas são cruciais para a valorização da peça, proporcionando uma experiência premium ao cliente e diferenciando o vendedor no mercado.",
    codes: ["8180", "8185", "8189"],
    sizes: ["4,6x5,1 (Só Frente)", "4,6x5,1 (Frente e Verso)", "9x5 (Só Frente)"],
  },
];
