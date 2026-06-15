import { type Product } from "../components/ui/ProductCard";

const IMG = "https://i.imgur.com/i5taW7t.png";

// ---------------------------------------------------------------------------
// Slugs para cada categoria de segurança (usados na URL)
// ---------------------------------------------------------------------------
export const SEGURANCA_SLUGS: Record<string, string> = {
  "antiderrapantes": "ANTIDERRAPANTES",
  "pisos":           "PISOS",
};

// ---------------------------------------------------------------------------
// Catálogo completo
// ---------------------------------------------------------------------------
export const SEGURANCA_CATALOG: Product[] = [

  // ── ANTIDERRAPANTES ───────────────────────────────────────────────────────
  {
    id: "sg-01",
    title: "FITA ANTIDERRAPANTE PRETA",
    category: "ANTIDERRAPANTES",
    image: "https://imgur.com/HYatBri.png",
    code: "6060",
    description: "Fita Antiderrapante: essencial para prevenir quedas e escorregões, aumentando significativamente a aderência em superfícies lisas e escorregadias. É fundamental para garantir a segurança em escadas, rampas, corredores e áreas úmidas, sendo adequada para uso tanto em ambientes internos quanto externos.",
  },

  // ── PISOS ─────────────────────────────────────────────────────────────────
  {
    id: "sg-02",
    title: "PISO TÁTIL",
    category: "PISOS",
    image: "https://imgur.com/3M59FBt.png",
    codes: ["6063", "6064"],
    sizes: ["Colorido", "Preto"],
    description: "Piso Tátil: um revestimento de solo com relevos específicos (direcional e de alerta) e cores contrastantes, projetado para garantir autonomia, segurança e mobilidade a pessoas com deficiência visual ou baixa visão. Ele orienta trajetos, sinaliza mudanças de direção e avisa sobre perigos ou obstáculos à frente, prevenindo acidentes. Amplamente utilizado em locais públicos e privados, calçadas e áreas de circulação.",
  },
  {
    id: "sg-03",
    title: "PISO MOEDA",
    category: "PISOS",
    image: "https://imgur.com/cvXQazu.png",
    code: "6062",
    description: "Piso Moeda: um revestimento emborrachado amplamente utilizado por sua excelente capacidade antiderrapante, durabilidade e resistência ao alto tráfego. Composto por borracha pura, possui relevos em formato de moeda que garantem maior tração e segurança ao caminhar. É ideal para rampas, escadas e áreas que ficam frequentemente molhadas ou escorregadias.",
  },
  {
    id: "sg-04",
    title: "CAPA PARA ELEVADOR",
    category: "PISOS",
    image: "https://imgur.com/hKVcwEo.png",
    code: "7171",
    description: "Capa para elevador: muito mais que uma simples cobertura, é a evolução em proteção para elevadores, exercendo a dupla função de capa e protetor. Aliando tecnologia, estética e durabilidade, este modelo foi desenvolvido com foco no conforto e na segurança dos usuários, proporcionando um ambiente mais agradável e seguro. Um investimento que valoriza o condomínio e traz grandes benefícios.",
  },
  {
    id: "sg-05",
    title: "RUBERCLECI",
    category: "PISOS",
    image: "https://imgur.com/b4DeLKA.png",
    code: "9194",
    description: "Piso emborrachado RUBERCLECI: uma solução de alto desempenho para absorção de impacto, segurança antiderrapante e isolamento acústico. Ideal para academias, áreas de pesos livres e locais com grande fluxo de pessoas e intensa movimentação.",
  },
];
