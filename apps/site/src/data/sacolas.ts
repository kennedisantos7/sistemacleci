import { type Product } from "../components/ui/ProductCard";

// ---------------------------------------------------------------------------
// Slugs para cada categoria de sacolas (usados na URL)
// Ordem aqui define a ordem no sidebar
// ---------------------------------------------------------------------------
export const SACOLAS_SLUGS: Record<string, string> = {
  "boca-palhaco":  "ALÇA BOCA DE PALHAÇO",
  "alca-camiseta": "ALÇA CAMISETA",
  "papel":         "PAPEL",
  "alca-fita":     "ALÇA FITA",
  "kraft":         "KRAFT",
  "tnt":           "TNT",
};

// ---------------------------------------------------------------------------
// Catálogo completo
//
// Cada subtipo é um produto só; os modelos viram linhas (`variants`), com suas
// próprias medidas, códigos, descrição e foto. A galeria do produto reúne as
// fotos de todas as linhas.
// ---------------------------------------------------------------------------
export const SACOLAS_CATALOG: Product[] = [

  // ── ALÇA BOCA DE PALHAÇO ──────────────────────────────────────────────────
  {
    id: "s-01",
    title: "SACOLAS ALÇA BOCA DE PALHAÇO",
    category: "ALÇA BOCA DE PALHAÇO",
    image: "https://i.imgur.com/pgMMaq0.png",
    images: ["https://i.imgur.com/vsPNfd8.jpeg", "https://i.imgur.com/gk0Zu7e.jpeg"],
    description: "Também chamada de Alça Vazada, é muito usada em lojas de confecções, óticas e lojas que desejam transportar produtos com mais elegância. Escolha o modelo: colorida, fosca ou cristal.",
    variants: [
      {
        name: "COLORIDA",
        image: "https://i.imgur.com/pgMMaq0.png",
        description: "Esse modelo de sacolas também chamado por Alça Vazada, é muito usado em lojas de confecções, óticas e lojas que desejam fazer o transporte de produtos com mais elegância, oferecendo um visual mais sofisticado e organizado. Ela transmite uma sofisticação superior às sacolas de plástico comuns.",
        codes: ["3011", "3012", "3013", "3014", "3015", "3016", "3017"],
        sizes: ["16x22", "15x28", "20x30", "25x38", "30x43", "35x53", "40x55"],
      },
      {
        name: "FOSCA",
        image: "https://i.imgur.com/vsPNfd8.jpeg",
        description: "Esse modelo de sacolas, também conhecido como Alça Vazada, possui as mesmas finalidades práticas da versão colorida, com um diferencial marcante: sua composição em material fosco, que apresenta uma leve transparência elegante, conforme exibido na imagem. A sacola fosca proporciona um visual mais sóbrio, moderno e minimalista, agregando um toque de requinte e valor ao seu produto. Além disso, ela garante um destaque excepcional para a cor da sua personalização, especialmente na cor preta.",
        codes: ["3018", "3019", "3020", "3033", "3022"],
        sizes: ["15x28", "20x30", "30x43", "35x53", "40x50"],
      },
      {
        name: "CRISTAL",
        image: "https://i.imgur.com/gk0Zu7e.jpeg",
        description: "Esse modelo de sacolas, também conhecido como Alça Vazada, une perfeitamente sofisticação, resistência e versatilidade. O termo 'Cristal' faz referência à sua total transparência e brilho cristalino, sendo produzida com polietileno de baixa densidade (PEBD) de primeira linha. Ideal para marcas que desejam destacar e valorizar o produto interno, ela proporciona uma apresentação de alto padrão, transmitindo cuidado, elegância e um toque premium imediato.",
        codes: ["3085", "3086", "3087", "3031", "3032", "3088"],
        sizes: ["15x28", "20x30", "25x38", "30x43", "35x53", "40x55"],
      },
    ],
  },

  // ── ALÇA CAMISETA ─────────────────────────────────────────────────────────
  {
    id: "s-04",
    title: "SACOLAS ALÇA CAMISETA",
    category: "ALÇA CAMISETA",
    image: "https://i.imgur.com/QwOCGfO.png",
    images: ["https://i.imgur.com/uOqDdDN.png"],
    description: "Sacolas do modelo alça camiseta, ideais para o transporte de mercadorias em geral. Escolha o modelo: supermercado ou colorida personalizada.",
    variants: [
      {
        name: "SUPERMERCADO",
        image: "https://i.imgur.com/QwOCGfO.png",
      },
      {
        name: "COLORIDA",
        image: "https://i.imgur.com/uOqDdDN.png",
        description: "Sacolas personalizadas do modelo alça camiseta, produzidas em alta densidade (4 a 7 micras). São ideais para o transporte de mercadorias em geral, como em lojas de calçados, confecções, vestuário e outros produtos que exigem resistência superior. Produzidas com matéria-prima virgem e tratadas especificamente para garantir uma impressão impecável da sua marca. Além da praticidade, as sacolas personalizadas funcionam como uma excelente ferramenta de marketing ambulante de baixo custo, promovendo a marca de sua empresa, aumentando a visibilidade e agregando valor aos seus produtos, ao mesmo tempo em que fortalecem a sua identidade visual e transmitem uma percepção de organização e cuidado ao cliente.",
        codes: ["3004", "3005", "3006", "3007", "3008", "3009", "3010"],
        sizes: ["40x40", "40x50", "50x60", "60x70", "60x80", "70x80", "90x1.00"],
      },
    ],
  },

  // ── PAPEL ─────────────────────────────────────────────────────────────────
  {
    id: "s-06",
    title: "SACOLAS DE PAPEL",
    category: "PAPEL",
    image: "https://imgur.com/Y7NpMgk.png",
    images: ["https://imgur.com/witlVqO.png"],
    description: "Sacolas de papel personalizadas para vestuário, calçados, alimentos e presentes. Escolha a linha que melhor atende ao seu negócio: Premium, Popular ou Plastificada.",
    variants: [
      {
        name: "LINHA PREMIUM",
        image: "https://imgur.com/Y7NpMgk.png",
        description: "Sacolas de papel da Linha Premium: fabricadas totalmente sob medida para atender aos desejos mais exigentes dos nossos clientes. Esta linha oferece uma ampla gama de acabamentos sofisticados, como laminação, Hot Stamping, alças de cetim ou modelo cadarço, além de gramaturas de papel personalizáveis. Ideal para quem busca exclusividade e o mais alto padrão de apresentação para sua marca.",
        codes: ["4013", "4021", "4022", "4054", "4039", "4038", "4040", "4023", "4028", "4026"],
        sizes: ["13x13x7", "16x14x7", "23x17x7", "22x18x11,5", "21,5x15x7,5", "23,5x14,5x7,5", "32,5x21x10", "24x35x10", "30x42x12", "35x45x16"],
      },
      {
        name: "LINHA POPULAR",
        image: "https://imgur.com/witlVqO.png",
        description: "Sacola de papel da Linha Popular: fabricada em papel offset branco de 180g (sem brilho) e com alças em fita de cetim. Este modelo oferece a vantagem de produção em qualquer quantidade, permitindo personalização colorida na frente, verso e laterais. Ideais para vestuário, calçados, alimentos e presentes, nossas sacolas unem funcionalidade, estética e sustentabilidade. São excelentes ferramentas de marketing e branding, transmitindo elegância e profissionalismo por um baixo custo de investimento.",
        codes: ["4013", "4021", "4022", "4054", "4039", "4038", "4040", "4023", "4028", "4026"],
        sizes: ["13x13x7", "16x14x7", "23x17x7", "22x18x11,5", "21,5x15x7,5", "23,5x14,5x7,5", "32,5x21x10", "24x35x10", "30x42x12", "35x45x16"],
      },
      {
        name: "LINHA PLASTIFICADA",
        description: "Sacola de papel com acabamento plastificado: a laminação garante mais resistência, proteção contra umidade e um brilho que valoriza as cores da sua personalização. Disponível nas medidas abaixo.",
        sizes: ["13x13x7", "16x14x7", "23x17x7", "22x18x11,5", "21,5x15x7,5", "23,5x14,5x7,5", "24x35x10"],
      },
    ],
  },

  // ── ALÇA FITA ─────────────────────────────────────────────────────────────
  {
    id: "s-09",
    title: "SACOLAS ALÇA FITA",
    category: "ALÇA FITA",
    image: "https://i.imgur.com/zgJsy0K.jpeg",
    images: [
      "https://i.imgur.com/fjPnc14.jpeg",
      // Fotos e vídeo da linha colorida
      "https://i.imgur.com/9QepWqk.png",
      "https://i.imgur.com/luQyK1B.png",
      "https://i.imgur.com/7wZjPNS.png",
      "https://i.imgur.com/NkSJese.png",
      "https://i.imgur.com/XAphJG9.png",
      "https://i.imgur.com/xXqZgDA.png",
      "https://i.imgur.com/14ReU0U.png",
      "https://i.imgur.com/zXXlvBn.png",
      "https://i.imgur.com/nzVvp89.png",
      "https://i.imgur.com/JuVrrwf.mp4",
    ],
    description: "As sacolas com alça fita destacam-se pela elegância, alta resistência e praticidade, com espessura robusta de 14 micras. Escolha o modelo: colorida ou fosca.",
    variants: [
      {
        name: "COLORIDA",
        image: "https://i.imgur.com/zgJsy0K.jpeg",
        description: "As sacolas com alça fita destacam-se pela elegância, alta resistência e praticidade. Com aparência sofisticada, elas oferecem um acabamento superior e diferenciado em relação aos demais modelos. Possuem uma espessura robusta de 14 micras, garantindo maior durabilidade e total segurança no transporte de mercadorias pesadas. Esse modelo faz toda a diferença na valorização do seu produto e do seu estabelecimento: seus clientes se sentirão confortáveis e elegantes ao carregar suas compras em uma embalagem tão bonita, que naturalmente chama a atenção e promove a sua marca por onde passa.",
        codes: ["3034", "3023", "3024", "3026"],
        sizes: ["27x40", "30x45", "40x50", "45x55"],
      },
      {
        name: "FOSCA",
        image: "https://i.imgur.com/fjPnc14.jpeg",
        description: "As sacolas com alça fita destacam-se pela elegância, alta resistência e praticidade. Na versão fosca, oferecem um visual moderno, sóbrio e minimalista com uma leve transparência sofisticada, garantindo um acabamento superior e diferenciado. Possuem uma espessura robusta de 14 micras, assegurando maior durabilidade e total segurança no transporte de mercadorias. Esse modelo faz toda a diferença na valorização do seu produto e do seu estabelecimento: seus clientes se sentirão confortáveis e elegantes ao carregar suas compras em uma embalagem tão bonita, que atrai olhares e promove a sua marca por onde passa.",
        codes: ["3027", "3028", "3029", "3030"],
        sizes: ["27x40", "30x45", "40x50", "45x55"],
      },
    ],
  },

  // ── KRAFT ─────────────────────────────────────────────────────────────────
  {
    id: "s-12",
    title: "SACOLAS KRAFT",
    category: "KRAFT",
    image: "https://i.imgur.com/aSiiKMj.png",
    images: [
      "https://imgur.com/15qBuUf.png",
      // Fotos da linha personalizada
      "https://i.imgur.com/9MpZrLq.png",
      "https://i.imgur.com/d3lQCaU.png",
      "https://i.imgur.com/8gDniOv.png",
      "https://i.imgur.com/uVYEzTw.png",
      "https://i.imgur.com/cyQp015.png",
      "https://i.imgur.com/TIaKOfT.png",
      "https://i.imgur.com/72J2lgE.png",
    ],
    description: "Sacola de papel kraft de alta qualidade, alternativa ecológica, resistente e sofisticada. Escolha o modelo: lisa ou personalizada.",
    variants: [
      {
        name: "LISA",
        image: "https://i.imgur.com/aSiiKMj.png",
        description: "Sacola de papel kraft lisa (sem personalização) de alta qualidade, projetada para garantir excelente durabilidade e uma estética impecável no transporte dos seus produtos. Ideal para marcas que buscam uma alternativa ecológica, resistente e sofisticada, agregando valor à experiência de entrega de forma prática e sustentável.",
        codes: ["4010", "4011", "4012"],
        sizes: ["25x18x8", "27x20x12", "30x40x12"],
      },
      {
        name: "PERSONALIZADA",
        image: "https://imgur.com/15qBuUf.png",
        description: "Sacola de papel kraft personalizada: ideal para empresas que buscam sustentabilidade e elegância. Atendemos pedidos em pequenas quantidades, oferecendo uma solução prática, ecológica e de alto impacto visual para sua marca.",
        codes: ["4004", "4005", "4006"],
        sizes: ["25x18x8", "27x20x12", "30x40x12"],
      },
    ],
  },

  // ── TNT ───────────────────────────────────────────────────────────────────
  {
    id: "s-14",
    title: "ALÇA BOCA DE PALHAÇO",
    category: "TNT",
    image: "https://imgur.com/sek8sYC.png",
    codes: ["4033"],
    sizes: ["Com 100 unidades"],
    description: "Sacola boca de palhaço de TNT personalizada, é um tipo de embalagem versátil e resistente, focada em sustentabilidade, pois é reutilizável. Tem a finalidade de servir como embalagem para brindes, presentes, festas e outros produtos leves de varejo. O TNT tem vantagens com relação ao plástico pela sua resistência e por ser ecologicamente correto.",
  },
];
