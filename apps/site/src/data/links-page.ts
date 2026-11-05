// ─────────────────────────────────────────────────────────────────────────────
// links-page.ts – dados da página de links (cleci.com.br/links)
// Para editar links, textos ou imagens da página, altere apenas este arquivo.
// As imagens ficam em public/images/links/.
// ─────────────────────────────────────────────────────────────────────────────

const IMG = '/images/links';

export const LINKS_BRAND = {
  name: 'CLECI PERSONALIZA',
  logo: `${IMG}/logo.webp`,
  tagline: 'Mais do que impressão, entregamos a sua marca! 🖨️',
  description: 'Com paixão por design e inovação, a CLECI PERSONALIZA nasceu para transformar a identidade da sua marca em realidade.',
  description2: 'Produzimos desde sacolas até cartões de visita com altíssima qualidade, personalização e o cuidado que o seu negócio merece.',
  whatsapp: 'https://api.whatsapp.com/send/?phone=5563992349085&text=Ol%C3%A1%2C+gostaria+de+solicitar+um+or%C3%A7amento!',
  instagram: 'https://instagram.com/clecipersonaliza',
  facebook: 'https://facebook.com/clecipersonaliza',
};

export interface LinkItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  /** true = abre em nova aba (sites externos, WhatsApp, Instagram). */
  external?: boolean;
}

// Os links para páginas do próprio site agora são caminhos internos ("/sacolas"),
// que abrem na mesma aba.
export const LINKS: LinkItem[] = [
  {
    id: 'site',
    title: 'Nosso Site',
    subtitle: 'Acesse agora',
    image: `${IMG}/link-site.webp`,
    href: '/',
  },
  {
    id: 'vendedor',
    title: 'Falar com Vendedor',
    subtitle: 'Atendimento via WhatsApp',
    image: `${IMG}/link-vendedor.webp`,
    href: 'https://api.whatsapp.com/send/?phone=5563992349085&text=Vim+pelo+site+e+gostaria+de+saber+mais+sobre+os+produtos&type=phone_number&app_absent=0',
    external: true,
  },
  {
    id: 'sacolas',
    title: 'Sacolas Personalizadas',
    subtitle: 'Ver Catálogo',
    image: `${IMG}/link-sacolas.webp`,
    href: '/sacolas',
  },
  {
    id: 'tapetes',
    title: 'Tapetes Sob Medida',
    subtitle: 'Ver Catálogo',
    image: `${IMG}/link-tapetes.webp`,
    href: '/tapetes',
  },
  {
    id: 'grafica',
    title: 'Serviços de Gráfica',
    subtitle: 'Conheça mais',
    image: `${IMG}/link-grafica.webp`,
    href: '/grafica',
  },
  /* Desativado (já estava assim na página antiga). A imagem existe em
     public/images/links/link-afiliados.webp caso queira reativar.
  {
    id: 'afiliados',
    title: 'Afiliados',
    subtitle: 'Seja um afiliado',
    image: `${IMG}/link-afiliados.webp`,
    href: '',
  },
  */
  {
    id: 'whatsapp-direct',
    title: 'WhatsApp',
    subtitle: 'Fale conosco',
    image: `${IMG}/link-whatsapp.webp`,
    href: LINKS_BRAND.whatsapp,
    external: true,
  },
  {
    id: 'instagram-direct',
    title: 'Instagram',
    subtitle: 'Siga-nos',
    image: `${IMG}/link-instagram.webp`,
    href: LINKS_BRAND.instagram,
    external: true,
  },
];

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
  label: string;
}

/** O primeiro item é o card grande (destaque). */
export const PRODUCT_IMAGES: ProductImage[] = [
  { id: 'sacolas-hero', src: `${IMG}/produto-sacolas.webp`, alt: 'Sacolas Personalizadas CLECI', label: 'Sacolas Personalizadas' },
  { id: 'cartoes-hero', src: `${IMG}/produto-cartoes.webp`, alt: 'Cartões de Visita CLECI', label: 'Cartões de Visita' },
  { id: 'tapetes-hero', src: `${IMG}/produto-tapetes.webp`, alt: 'Tapetes Sob Medida CLECI', label: 'Tapetes Sob Medida' },
];

export const TEAM_IMAGE = {
  src: `${IMG}/equipe.webp`,
  alt: 'Equipe CLECI PERSONALIZA',
};

export const DEV_LOGO = `${IMG}/dev-logo.webp`;
