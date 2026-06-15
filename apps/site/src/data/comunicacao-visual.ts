import { type Product } from "../components/ui/ProductCard";

const IMG = "https://i.imgur.com/nMe19zi.png";

// ---------------------------------------------------------------------------
// Slugs para cada categoria de comunicação visual (usados na URL)
// Ordem aqui define a ordem no sidebar
// ---------------------------------------------------------------------------
export const COMUNICACAO_VISUAL_SLUGS: Record<string, string> = {
  "wind-banners":  "WIND BANNERS",
  "bandeiras":     "BANDEIRAS",
  "lonas-banners": "LONAS E BANNERS",
  "acessorios":    "ACESSÓRIOS",
  "caixa-pizza":   "CAIXA DE PIZZA",
};

// ---------------------------------------------------------------------------
// Catálogo completo
// ---------------------------------------------------------------------------
export const COMUNICACAO_VISUAL_CATALOG: Product[] = [

  // ── WIND BANNERS ─────────────────────────────────────────────────────────
  {
    id: "cv-01",
    title: "WIND BANNER",
    category: "WIND BANNERS",
    image: "https://i.imgur.com/VK0Oygu.png",
    description: "Wind Banner (ou bandeirola): uma ferramenta de marketing visual de alto impacto, projetada para atrair a atenção do público tanto em ambientes externos quanto internos com grande fluxo de pessoas. Com estrutura flexível e desmontável, é fácil de transportar para qualquer local, sendo ideal para feiras, eventos e frentes de loja. Disponível para venda completa ou em partes separadas (tecido, base e hastes).",
    codes: ["10188", "10189", "10190", "10191", "10227"],
    sizes: ["Kit Completo", "Só Tecido", "Só Base Plástica", "Haste Alumínio", "Haste Ferro"],
  },

  // ── BANDEIRAS ─────────────────────────────────────────────────────────────
  {
    id: "cv-04",
    title: "BANDEIRA DE MÃO",
    category: "BANDEIRAS",
    image: "https://imgur.com/ihcubVm.png",
    description: "Bandeiras de mão versáteis, ideais para manifestações, eventos esportivos, festividades e sinalização manual. Fabricadas com materiais leves e resistentes, garantindo praticidade no manuseio e alta visibilidade.",
    code: "10192",
    sizes: ["1,00m x 70cm"],
  },
  {
    id: "cv-05",
    title: "BANDEIRA PARA VEÍCULO",
    category: "BANDEIRAS",
    image: "https://imgur.com/bI4Jh3a.png",
    description: "Bandeiras projetadas especificamente para uso em veículos. Ideais para frotas, eventos automotivos e promoções, oferecendo alta resistência ao vento e visibilidade em movimento.",
    code: "10194",
    sizes: ["60x40cm"],
  },
  {
    id: "cv-06",
    title: "BANDEIRAS DE CHÃO",
    category: "BANDEIRAS",
    image: "https://imgur.com/wUI96Qj.png",
    description: "Bandeiras de solo projetadas para fixação direta no chão. São ideais para demarcação de áreas, sinalização externa e eventos, oferecendo resistência e visibilidade em diversos tipos de terreno.",
    code: "10193",
    sizes: ["60x40cm"],
  },
  {
    id: "cv-07",
    title: "BANDEIRA PARA LOTEAMENTO",
    category: "BANDEIRAS",
    image: "https://imgur.com/Gg1vvVc.png",
    description: "Bandeiras de solo para fixação em chão, ideais para a identificação e demarcação de loteamentos. Proporcionam alta visibilidade e resistência, sendo uma solução prática e eficiente para sinalização em campo.",
    code: "10226",
    sizes: ["70x50cm"],
  },
  {
    id: "cv-08",
    title: "BANDEIRAS INSTITUCIONAIS",
    category: "BANDEIRAS",
    image: "https://imgur.com/Q1mkZVB.png",
    description: "Bandeiras para diversos usos, incluindo representação de nações, estados, municípios, igrejas, associações e empresas. Utilizadas como símbolo de identidade, sinalização e representação para qualquer finalidade, as bandeiras institucionais expressam valores e ideais, servindo como um poderoso símbolo de respeito e tradição. Disponíveis em diversos tamanhos padrão ou sob medida.",
    codes: ["10195", "10196", "10197", "Sob Medida"],
    sizes: ["90cm x 1,30m", "1,12m x 1,60m", "1,35m x 1,92m", "Sob Medida"],
  },
  {
    id: "cv-09",
    title: "BIRUTAS",
    category: "BANDEIRAS",
    image: "https://imgur.com/mYOzeSt.png",
    description: "A biruta desempenha uma função vital, especialmente em aeroportos: indicar visualmente e em tempo real a direção e a velocidade aproximada do vento. É um equipamento essencial para a segurança e orientação de pilotos durante decolagens e pousos, além de auxiliar na identificação da propagação de fumaça ou gases perigosos.",
    code: "10244",
  },

  // ── LONAS E BANNERS ───────────────────────────────────────────────────────
  {
    id: "cv-10",
    title: "LONA PARA FACHADA",
    category: "LONAS E BANNERS",
    image: "https://imgur.com/WsY3jFy.png",
    description: "Lona para fachada com produção sob medida. A fachada cumpre funções que vão muito além da estética, atuando como uma identidade visual que protege, comunica e valoriza o imóvel. Sendo o cartão de visitas de uma empresa, é uma das formas mais poderosas de marketing, transmitindo imediatamente a essência do seu negócio para o público.",
    sizes: ["Por m²"],
  },
  {
    id: "cv-11",
    title: "LONA PARA PAINEL COM ILHOIS",
    category: "LONAS E BANNERS",
    image: "https://imgur.com/1IlEDdS.png",
    description: "Lona para painel com ilhoses para facilitar a fixação, o tensionamento e a exibição uniforme da lona. Proporciona uma visibilidade perfeita, mantendo a superfície lisa e bem apresentada. Os ilhoses são aros metálicos que reforçam os furos na lona, evitando rasgos e tornando a instalação prática e segura. Ideal para fachadas, promoções, sinalização de eventos e campanhas publicitárias.",
    code: "10202",
    sizes: ["Sob Medida"],
  },
  {
    id: "cv-12",
    title: "BANNER",
    category: "LONAS E BANNERS",
    image: "https://imgur.com/IHuq9nW.png",
    description: "Banner de alta qualidade com produção sob medida. Ideal para eventos, congressos e publicidade, garantindo impacto visual e clareza nas informações. Embora possa ser fabricado em qualquer dimensão, o tamanho padrão é 1,20m de altura por 90cm de largura. Acompanha cordão para pendurar.",
    code: "10203",
    sizes: ["Padrão (1,20m x 90cm)", "Sob Medida"],
  },

  // ── ACESSÓRIOS ────────────────────────────────────────────────────────────
  {
    id: "cv-14",
    title: "FITA DE CETIM PERSONALIZADA",
    category: "ACESSÓRIOS",
    image: "https://imgur.com/Ym0WUmQ.png",
    description: "Fita de cetim personalizada: valorize sua marca ao decorar embalagens com laços sofisticados. Agrega um toque de exclusividade e profissionalismo a produtos e presentes, fortalecendo sua identidade visual. Ideal para o fechamento de caixas, sacolas e embrulhos, oferecendo uma infinidade de possibilidades de acabamento. Disponível em diversas metragens.",
    codes: ["4036", "4037", "4038", "4075"],
    sizes: ["10 Metros", "20 Metros", "30 Metros", "50 Metros"],
  },
  {
    id: "cv-15",
    title: "FITA DE CETIM LISA",
    category: "ACESSÓRIOS",
    image: "https://i.imgur.com/29OSHS0.png",
    code: "4077",
  },

  // ── CAIXA DE PIZZA ────────────────────────────────────────────────────────
  {
    id: "cv-17",
    title: "LINHA POPULAR",
    category: "CAIXA DE PIZZA",
    image: "https://imgur.com/5Hm3pN5.png",
    description: "Caixas de pizza personalizadas com a logo da sua pizzaria (Linha Popular). Embalagens personalizadas são uma estratégia de marketing e branding com investimento reduzido, fortalecendo a divulgação da sua marca e aumentando a percepção de valor do seu produto. Una a necessidade de higiene e segurança no transporte à oportunidade de promover seu negócio com baixo custo.",
    code: "4081",
    sizes: ["35cm"],
  },
  {
    id: "cv-18",
    title: "PREMIUM",
    category: "CAIXA DE PIZZA",
    image: "https://imgur.com/ARfrObY.png",
    description: "Caixas de pizza personalizadas com sua logo, com impressão offset de alta qualidade e fidelidade total a cores e formatos. Papelão super resistente e virgem, atendendo a todas as exigências da Vigilância Sanitária para o transporte de alimentos.",
    codes: ["4027", "4025", "4020", "4019", "4018", "4015", "4014"],
    sizes: ["20cm", "25cm", "30cm", "35cm", "40cm", "45cm", "47cm"],
  },
];
