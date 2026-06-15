// ---------------------------------------------------------------------------
// Constantes globais de WhatsApp — edite aqui para propagar por todo o site
// ---------------------------------------------------------------------------

/** Número de WhatsApp para recebimento de pedidos */
export const WA_NUMBER = "556392349085";
export const WA_BASE = `https://wa.me/${WA_NUMBER}`;

/** Gera o link de WhatsApp com mensagem personalizada por categoria/produto */
export function buildWaLink(
  productTitle: string,
  options?: {
    category?: string;
    size?: string;
    code?: string;
    withInstallation?: boolean;
  }
): string {
  const { category = "", size, code, withInstallation } = options ?? {};

  // Combina categoria e título do produto de forma inteligente e sem duplicar
  let fullProductTitle = productTitle;
  if (category) {
    const catClean = category.trim();
    const titleClean = productTitle.trim();
    
    // Se o título já não contiver a categoria, combinamos ambos
    if (!titleClean.toLowerCase().includes(catClean.toLowerCase())) {
      const firstWordCat = catClean.split(' ')[0].toLowerCase();
      const firstWordTitle = titleClean.split(' ')[0].toLowerCase();
      
      if (firstWordCat === firstWordTitle) {
        fullProductTitle = titleClean;
      } else {
        fullProductTitle = `${catClean} ${titleClean}`;
      }
    }
  }

  const sizeInfo = size 
    ? (size.toLowerCase().includes("borda") ? ` com *${size}*` : ` no tamanho *${size}*`) 
    : "";
  const codeInfo = code ? ` (Cód. ${code})` : "";
  const installInfo = withInstallation ? " *COM INSTALAÇÃO*" : "";

  // Mensagens personalizadas por categoria - Removi emojis complexos e usei formatação mais limpa
  let message: string;

  const cat = category.toLowerCase();

  if (cat.includes("sacola") || cat.includes("alça") || cat.includes("boca palh") || cat.includes("kraft") || cat.includes("papel") || cat.includes("ecobag") || cat.includes("tnt") || cat.includes("presente")) {
    message = `Olá! Vim pelo site da Cleci Personaliza e tenho interesse em *${fullProductTitle}*${sizeInfo}${codeInfo}${installInfo}. Poderia me passar mais informações sobre quantidade mínima, prazo de entrega e valores?`;
  } else if (cat.includes("tapete") || cat.includes("vinil") || cat.includes("naylon") || cat.includes("passarela") || cat.includes("adcleci") || cat.includes("veículo") || cat.includes("bordas") || cat.includes("liso") || cat.includes("vulcaniz") || cat.includes("jato")) {
    message = `Olá! Vim pelo site da Cleci Personaliza e tenho interesse no tapete *${fullProductTitle}*${sizeInfo}${codeInfo}${installInfo}. Gostaria de saber mais sobre personalização e valores. Pode me ajudar?`;
  } else if (cat.includes("panfleto") || cat.includes("cartão") || cat.includes("envelope") || cat.includes("pasta") || cat.includes("tag") || cat.includes("adesivo")) {
    message = `Olá! Vim pelo site da Cleci Personaliza e tenho interesse em *${fullProductTitle}*${sizeInfo}${codeInfo}. Gostaria de saber sobre quantidades disponíveis, personalização e valores para impressão.`;
  } else if (cat.includes("wind banner") || cat.includes("bandeira") || cat.includes("lona") || cat.includes("banner")) {
    message = `Olá! Vim pelo site da Cleci Personaliza e tenho interesse em *${fullProductTitle}*${sizeInfo}${codeInfo}. Gostaria de saber mais sobre personalização, medidas disponíveis e valores.`;
  } else if (cat.includes("brinde") || cat.includes("fita") || cat.includes("cordão") || cat.includes("boné") || cat.includes("chaveiro")) {
    message = `Olá! Vim pelo site da Cleci Personaliza e tenho interesse em *${fullProductTitle}*${codeInfo}. Gostaria de mais informações sobre personalização e quantidades mínimas para pedido.`;
  } else if (cat.includes("antiderrapante") || cat.includes("piso") || cat.includes("fita preta") || cat.includes("fita transparente")) {
    message = `Olá! Vim pelo site da Cleci Personaliza e tenho interesse em *${fullProductTitle}*${sizeInfo}${codeInfo}. Poderia me informar sobre disponibilidade, quantidade mínima e valores?`;
  } else if (cat.includes("playground") || cat.includes("grama") || cat.includes("pneu")) {
    message = `Olá! Vim pelo site da Cleci Personaliza e tenho interesse em *${fullProductTitle}*${sizeInfo}${codeInfo}${installInfo}. Gostaria de informações sobre instalação, medidas e valores.`;
  } else if (cat.includes("mesa") || cat.includes("freezer") || cat.includes("capa") || cat.includes("jogo americano") || cat.includes("forro")) {
    message = `Olá! Vim pelo site da Cleci Personaliza e tenho interesse em *${fullProductTitle}*${sizeInfo}${codeInfo}${installInfo}. Poderia me passar informações sobre personalização e valores?`;
  } else {
    message = `Olá! Vim pelo site da Cleci Personaliza e tenho interesse em *${fullProductTitle}*${sizeInfo}${codeInfo}${installInfo}. Poderia me passar mais informações?`;
  }

  // Retornando a URL com a mensagem codificada de forma limpa
  return `${WA_BASE}?text=${encodeURIComponent(message)}`;
}
