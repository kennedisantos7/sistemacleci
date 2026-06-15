import { type Product, type BorderOption } from "../components/ui/ProductCard";

// ---------------------------------------------------------------------------
// Slugs para cada categoria de tapetes (usados na URL)
// ---------------------------------------------------------------------------
export const TAPETES_SLUGS: Record<string, string> = {
  "master":           "MASTER",
  "naycleci":         "NAYCLECI",
  "gold":             "GOLD",
  "14mm":             "14MM",
  "cleancleci":       "CLEANCLECI",
  "maxcleci":         "MAXCLECI",
  "duocleci":         "DUOCLECI",
  "veiculos":         "VEÍCULOS",
  "tapete-secantes":  "TAPETES SECANTES",
};

// ---------------------------------------------------------------------------
// Bordas padrão disponíveis para tapetes
// ---------------------------------------------------------------------------
export const TAPETES_BORDERS: BorderOption[] = [
  {
    name: "Borda Rebaixada",
    image: "https://i.imgur.com/tTBvFAu.png",
    code: "1017",
  },
  {
    name: "Borda Rebaixada Pintada",
    image: "https://i.imgur.com/zZDuwd0.png",
    code: "1018",
  },
  {
    name: "Borda Rampinha",
    image: "https://i.imgur.com/uMYFaBg.png",
    code: "1019",
  },
];

// Apenas a Borda Rampinha é permitida para MAXCLECI
export const MAXCLECI_BORDERS: BorderOption[] = [
  {
    name: "Borda Rampinha",
    image: "https://i.imgur.com/uMYFaBg.png",
    code: "1019",
  },
];

// ---------------------------------------------------------------------------
// Catálogo completo
// ---------------------------------------------------------------------------
export const TAPETES_CATALOG: Product[] = [

  // ── MASTER ────────────────────────────────────────────────────────────────
  {
    id: "t-05",
    title: "LISO",
    category: "MASTER",
    image: "https://i.imgur.com/TE878Lg.png",
    code: "1001",
    description: "MASTER. Sua trama entrelaçada possui uma densidade inferior em comparação aos outros modelos. Por ter uma composição de materiais menos resistentes, sua trama é mais fina que as demais, sendo uma opção mais básica.",
  },
  {
    id: "t-10",
    title: "PERSONALIZADO C/ JATO DE TINTA",
    category: "MASTER",
    image: "https://i.imgur.com/B47h1h2.png",
    description: "MASTER. Neste modelo, a personalização é feita diretamente na base do tapete por meio de jato de tinta, sem a necessidade de recortes. As vantagens incluem um processo mais rápido e econômico, preservando a integridade da base original.",
    codes: ["2018"],
  },

  // ── NAYCLECI ──────────────────────────────────────────────────────────────
  {
    id: "t-07",
    title: "LISO",
    category: "NAYCLECI",
    image: "https://i.imgur.com/nC96zji.png",
    code: "2046",
    description: "NAYCLECI. Este modelo é indicado para locais de tráfego moderado na superfície, embora sua base suporte alto tráfego. Com fios de nylon e base de borracha PVC, oferece excelente segurança antiderrapante, prevenindo escorregões e quedas.",
  },
  {
    id: "t-12",
    title: "PERSONALIZADO C/ JATO DE TINTA",
    category: "NAYCLECI",
    image: "https://i.imgur.com/88f4ODN.png",
    code: "2047",
    description: "NAYCLECI. Este modelo permite personalização exclusivamente via jato de tinta, sendo indicado para locais de tráfego moderado na superfície, embora sua base suporte alto tráfego. Com fios de nylon e base de borracha PVC, oferece excelente segurança antiderrapante, prevenindo escorregões e quedas.",
  },

  // ── GOLD ──────────────────────────────────────────────────────────────────
  {
    id: "t-06",
    title: "LISO",
    category: "GOLD",
    image: "https://i.imgur.com/TE878Lg.png",
    code: "1003",
    description: "GOLD. Sua trama é mais grossa, sendo fabricado com materiais que conferem maior resistência e durabilidade superior ao modelo Master. Embora a forma do tecido e o fundo costal sejam os mesmos, o Gold possui uma grande vantagem in sua fabricação: a trama já é colada na base simultaneamente, o que aumenta significativamente sua resistência em relação aos demais modelos.",
    borders: TAPETES_BORDERS,
  },
  {
    id: "t-11",
    title: "PERSONALIZADO C/ JATO DE TINTA",
    category: "GOLD",
    image: "https://i.imgur.com/B47h1h2.png",
    code: "2021",
    description: "GOLD. Neste modelo, a personalização é feita diretamente na base do tapete por meio de jato de tinta, sem a necessidade de recortes. As vantagens incluem um processo mais rápido e econômico, preservando a integridade da base original. A desvantagem é que a personalização pode apresentar um desgaste mais rápido em comparação ao método vulcanizado.",
    borders: TAPETES_BORDERS,
  },
  {
    id: "t-14",
    title: "VULCANIZADO",
    category: "GOLD",
    image: "https://i.imgur.com/B47h1h2.png",
    code: "2034",
    description: "GOLD VULCANIZADO. É um sistema de montagem onde o logotipo e as letras são encaixados como um quebra-cabeça, utilizando o próprio material da base. Isso garante uma personalização permanente and de alta durabilidade: enquanto o tapete durar, as cores da escrita e do logo permanecerão vivas e nítidas.",
    borders: TAPETES_BORDERS,
  },
  {
    id: "t-17",
    title: "PERSONALIZADO C/ ADCLECI",
    category: "GOLD",
    image: "https://i.imgur.com/TTfIhiH.png",
    code: "1020",
    description: "LINHA ADCLECI. A arte é impressa e vulcanizada diretamente na trama do tapete, criando um leve rebaixamento. Este processo permite a inclusão de logos detalhados e diversas informações com alta fidelidade. A personalização ADCLECI pode ser aplicada em apenas um canto, mantendo o restante do corpo do tapete liso — ideal para clientes que preferem não ter sua marca pisada. Permite a inserção de patrocinadores nos cantos. Exclusivo do modelo Gold.",
    borders: TAPETES_BORDERS,
  },

  // ── 14MM ──────────────────────────────────────────────────────────────────
  {
    id: "t-30",
    title: "LISO",
    category: "14MM",
    image: "https://i.imgur.com/h18fHZ0.png",
    code: "1007",
    description: "14MM. Este modelo é fabricado com a mesma tecnologia do Gold, porém sua trama possui fios três vezes mais grossos. Tanto a trama quanto a base são mais espessas, conferindo uma resistência superior e uma altura 4mm maior que o Gold. É o tapete ideal para áreas de tráfego intenso. Devido à sua maior espessura e resistência, é aconselhável o uso de bordas rampadas (rampinhas).",
    borders: TAPETES_BORDERS,
  },
  {
    id: "t-13",
    title: "PERSONALIZADO C/ JATO DE TINTA",
    category: "14MM",
    image: "https://i.imgur.com/NWZ4nQG.png",
    code: "2024",
    description: "14MM. Neste modelo, a personalização é feita por jato de tinta diretamente na base. Sua trama possui fios três vezes mais grossos que o Gold, conferindo resistência superior. É o tapete ideal para áreas de tráfego intenso.",
    borders: TAPETES_BORDERS,
  },
  {
    id: "t-16",
    title: "VULCANIZADO",
    category: "14MM",
    image: "https://i.imgur.com/NWZ4nQG.png",
    code: "2035",
    description: "14MM VULCANIZADO. O logotipo e as letras são encaixados como um quebra-cabeça, utilizando o próprio material da base. Isso garante uma personalização permanente e de alta durabilidade. Sua trama com fios três vezes mais grossos que o Gold oferece resistência superior para ambientes de alto tráfego.",
    borders: TAPETES_BORDERS,
  },

  // ── CLEANCLECI ────────────────────────────────────────────────────────────
  {
    id: "t-08",
    title: "LISO",
    category: "CLEANCLECI",
    image: "https://i.imgur.com/NACW9j9.png",
    code: "1016",
    description: "CLEANCLECI LISO. Produto de alta absorção de umidade e retenção de sujeira, com base antiderrapante em borracha PVC fundida na trama de nylon. Possui design sofisticado e alta durabilidade, com espessura de 7mm. Este tapete é semelhante a um carpete, de fácil manuseio e transporte devido ao seu peso de apenas 3,5 kg/m². Disponível em diversas cores.",
    borders: MAXCLECI_BORDERS,
  },
  {
    id: "t-31",
    title: "PERSONALIZADO",
    category: "CLEANCLECI",
    image: "https://i.imgur.com/ayD3xh4.png",
    description: "CLEANCLECI PERSONALIZADO. Tapete de alto desempenho com personalização digital (Jetprint), ideal para áreas internas e externas. Alta capacidade de retenção de sujeira e umidade dos solados, secando em até 70%. Fabricação 100% poliamida com base de borracha PVC antiderrapante. Ideal para palcos de artistas pela facilidade de transporte, pesando apenas 3,5 kg/m². O produto se destaca pela beleza, durabilidade and alta performance, sendo também excelente como carpete personalizado para salas de espera e clínicas.",
    borders: MAXCLECI_BORDERS,
  },

  // ── MAXCLECI ──────────────────────────────────────────────────────────────
  {
    id: "t-32",
    title: "LISO",
    category: "MAXCLECI",
    image: "https://i.imgur.com/UdATGJD.png",
    code: "2075",
    description: "MAXCLECI. Produzido 100% com fios de polipropileno, este tapete possui uma trama entrelaçada de fios grossos que formam um desenho em alto-relevo de 8mm x 2mm. Esse relevo foi projetado para a retenção eficiente de grãos de areia e sujeira, bastando sacudir o tapete para limpá-lo. Retém até 60% da umidade dos solados, mantendo o piso seco. Com fundo de borracha PVC, oferece segurança antiderrapante e conforto. Ideal para áreas de tráfego intenso. Sua superfície é extremamente resistente, não deforma e mantém a cor por longos períodos, suportando inclusive o uso intenso de carrinhos de compras.",
    borders: MAXCLECI_BORDERS,
  },
  {
    id: "t-15",
    title: "VULCANIZADO",
    category: "MAXCLECI",
    image: "https://i.imgur.com/3nf6yrG.png",
    code: "2076",
    description: "MAXCLECI VULCANIZADO. O logotipo e as letras são encaixados como um quebra-cabeça, utilizando o próprio material da base do tapete. Isso garante uma personalização permanente e de alta durabilidade. A trama em alto-relevo de polipropileno alia beleza e performance máxima para áreas de alto tráfego.",
    borders: MAXCLECI_BORDERS,
  },

  // ── DUOCLECI ──────────────────────────────────────────────────────────────
  {
    id: "t-09",
    title: "LISO",
    category: "DUOCLECI",
    image: "https://i.imgur.com/436O4rh.png",
    description: "DUOCLECI. Tapete capacho de alto tráfego, projetado com tecnologia de dupla fibra para remover sujeiras pesadas e absorver a umidade dos solados, secando até 70% mais que os tapetes convencionais. Sua superfície é composta de polipropileno com cerdas de fios de nylon, e sua base é de borracha PVC, garantindo segurança contra quedas e escorregões. É o tapete ideal para elevadores, áreas de atendimento ou qualquer local com tráfego intenso. Indicado para passarelas in frente a balcões de atendimento para evitar o desgaste do piso. Nota: O modelo DUOCLECI é utilizado apenas sem personalização.",
  },

  // ── VEÍCULOS ──────────────────────────────────────────────────────────────
  {
    id: "t-22",
    title: "GOLD",
    category: "VEÍCULOS",
    image: "https://i.imgur.com/gfNOj5v.png",
    description: "GOLD VEÍCULOS. Sua trama é mais grossa, sendo fabricado com materiais que conferem maior resistência e durabilidade. A trama já é colada na base simultaneamente, o que aumenta significativamente sua resistência. Ideal para personalização na entrega e showroom de veículos.",
  },
  {
    id: "t-23",
    title: "NAYCLECI",
    category: "VEÍCULOS",
    image: "https://i.imgur.com/3z5ktY8.png",
    description: "NAYCLECI VEÍCULOS. Com fios de nylon e base de borracha PVC, oferece excelente segurança antiderrapante, prevenindo escorregões e quedas. Ideal para personalização em concessionárias e showrooms de veículos.",
  },
  {
    id: "t-24",
    title: "ENTREGA DE VEÍCULO",
    category: "VEÍCULOS",
    image: "https://i.imgur.com/7grRofk.png",
    description: "Tapete personalizado para cerimônia de entrega de veículo. Uma forma especial e memorável de presentear seu cliente no momento da entrega do carro, fortalecendo o vínculo com sua marca.",
  },
  {
    id: "t-25",
    title: "ENTREGA DE MOTO",
    category: "VEÍCULOS",
    image: "https://i.imgur.com/zslxlMm.png",
    description: "Tapete personalizado para cerimônia de entrega de moto. Uma forma especial e memorável de presentear seu cliente no momento da entrega, fortalecendo o vínculo com sua marca.",
  },
  {
    id: "t-33",
    title: "LIXOCAR",
    category: "VEÍCULOS",
    image: "https://i.imgur.com/hudtgbP.png",
    description: "Lixocar personalizado para câmbio de carro e diversas utilidades. Sendo personalizado, funciona como uma excelente ferramenta de marketing e divulgação da sua marca. O Lixocar mantém o interior do veículo organizado e limpo, evitando o descarte de lixo em vias públicas. É muito utilizado em lava-jatos como brinde, sendo uma ótima forma de fidelização e agradecimento ao cliente.",
    codes: ["5052", "5053", "5054", "5064", "5050"],
    sizes: ["Liso (1.000 un)", "Personalizado (1.000 un)", "200 un", "600 un", "200 un (21x26cm)"],
  },
  {
    id: "t-34",
    title: "CHEIRINHO",
    category: "VEÍCULOS",
    image: "https://imgur.com/yzXg01l.png",
    description: "O aromatizante (cheirinho) automotivo é ideal para perfumar e neutralizar odores indesejáveis no interior do veículo, proporcionando uma sensação de limpeza, conforto e bem-estar. O cheirinho é bastante utilizado como brinde em lava-jatos e também como mimo em diversos tipos de negócios. Além de perfumar o interior do veículo, é uma excelente ferramenta de marketing para a divulgação da sua marca e do seu negócio.",
  },
  {
    id: "t-35",
    title: "TAPETE DE PAPEL",
    category: "VEÍCULOS",
    image: "https://imgur.com/2w3OBeq.png",
    description: "O tapete de papel personalizado para veículos protege o interior do automóvel contra sujeiras por um curto período. Por ser uma solução prática e personalizada, sua maior finalidade é a divulgação e o marketing da sua marca, transmitindo ao cliente uma agradável sensação de limpeza, cuidado e conforto.",
    codes: ["5055", "5056"],
    sizes: ["66x48", "48x33"],
  },
  {
    id: "t-36",
    title: "CARTEIRA DESPACHANTE",
    category: "VEÍCULOS",
    image: "https://i.imgur.com/wefrUBW.png",
    description: "A carteira de despachante e porta-documentos (disponível nas opções de três faces e modelo cheque) tem como finalidade proteger e organizar documentos essenciais, como o documento do veículo, CNH e outros papéis importantes. Proporciona fácil acesso no dia a dia, inclusive facilitando a apresentação em abordagens de trânsito. Além disso, é uma excelente ferramenta para a divulgação da marca de empresas e despachantes.",
    codes: ["10240", "10242"],
    sizes: ["Três faces", "Modelo cheque"],
  },



  // ── TAPETES SECANTES ──────────────────────────────────────────────────────
  {
    id: "t-29",
    title: "KIT 3 PEÇAS",
    category: "TAPETES SECANTES",
    image: "https://i.imgur.com/fEHD7jk.png",
    description: "KIT 3 PEÇAS. Composto por 1 base resistente e 2 tapetes de algodão com fixação por velcro, facilitando a troca e higienização.",
  },
];
