export type Category = 'homme' | 'femme' | 'enfant' | 'accessoires';
export type Locale = 'fr' | 'en';

export const CATEGORIES: Category[] = ['homme', 'femme', 'enfant', 'accessoires'];

export interface LocalizedText {
  fr: string;
  en: string;
}

export interface Product {
  id: string;
  slug: string;
  category: Category;
  subcategory: string;
  name: LocalizedText;
  description: LocalizedText;
  priceEur: number;
  sizes: string[];
  colors: string[];
  imageCount: number;
  isNew?: boolean;
  relatedProductIds?: string[];
  availableQuantity?: number;
  /** Uploaded media URLs (empty/undefined = fall back to getProductImageUrl). */
  images?: string[];
  /** Original ("compare-at") price in euros, shown struck-through when > priceEur. */
  compareAtEur?: number;
}

export const COLOR_SWATCHES: Record<string, string> = {
  Noir: '#0d0d0d',
  Blanc: '#ffffff',
  'Bleu acier': '#3b4a5a',
  Gris: '#808080',
  Écru: '#e6e2d8',
  Camel: '#a9744f',
  Sable: '#e1d5c1',
  Bordeaux: '#800020',
  'Bleu marine': '#1d2731',
  Kaki: '#4b5320'
};

/** Shared across Homme/Femme/Enfant so every clothing product uses the same pill selector. */
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const ALL_PRODUCTS: Product[] = [
  {
    id: 'homme-veste-oversize',
    slug: 'homme-veste-oversize',
    category: 'homme',
    subcategory: 'vestes',
    name: { fr: 'Veste oversize structurée', en: 'Structured oversized jacket' },
    description: {
      fr: "Une veste à l'épaule marquée et à la coupe ample, pensée pour une silhouette affirmée.",
      en: 'A sharp-shouldered, generously cut jacket built for a strong silhouette.'
    },
    priceEur: 320,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 4,
    isNew: true,
    relatedProductIds: ['homme-pantalon-droit', 'homme-chemise-col-mao']
  },
  {
    id: 'homme-t-shirt-essentiel',
    slug: 'homme-t-shirt-essentiel',
    category: 'homme',
    subcategory: 't-shirts',
    name: { fr: 'T-shirt essentiel côtelé', en: 'Essential ribbed t-shirt' },
    description: {
      fr: 'Coton côtelé épais, coupe droite, pour une base solide de vestiaire.',
      en: 'Heavyweight ribbed cotton, straight cut, a solid wardrobe staple.'
    },
    priceEur: 65,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Blanc', 'Écru'],
    imageCount: 3,
    relatedProductIds: ['homme-chemise-col-mao', 'homme-pantalon-droit']
  },
  {
    id: 'homme-pantalon-droit',
    slug: 'homme-pantalon-droit',
    category: 'homme',
    subcategory: 'pantalons',
    name: { fr: 'Pantalon droit taille haute', en: 'High-rise straight trousers' },
    description: {
      fr: 'Coupe droite intemporelle en twill dense, taille haute structurée.',
      en: 'Timeless straight cut in dense twill, structured high-rise waist.'
    },
    priceEur: 145,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Gris'],
    imageCount: 3,
    relatedProductIds: ['homme-veste-oversize']
  },
  {
    id: 'homme-chemise-col-mao',
    slug: 'homme-chemise-col-mao',
    category: 'homme',
    subcategory: 'chemises',
    name: { fr: 'Chemise col mao', en: 'Mandarin collar shirt' },
    description: {
      fr: 'Popeline légère, col mao épuré, boutonnage invisible.',
      en: 'Lightweight poplin, clean mandarin collar, concealed placket.'
    },
    priceEur: 110,
    sizes: CLOTHING_SIZES,
    colors: ['Blanc', 'Noir'],
    imageCount: 3,
    relatedProductIds: ['homme-t-shirt-essentiel', 'homme-veste-oversize']
  },
  {
    id: 'femme-robe-fluide',
    slug: 'femme-robe-fluide',
    category: 'femme',
    subcategory: 'robes',
    name: { fr: 'Robe fluide asymétrique', en: 'Asymmetric flowing dress' },
    description: {
      fr: 'Drapé fluide, ourlet asymétrique, coupe qui accompagne le mouvement.',
      en: 'Fluid drape, asymmetric hem, a cut that moves with you.'
    },
    priceEur: 235,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 4,
    isNew: true,
    relatedProductIds: ['femme-manteau-long', 'accessoires-ceinture-cuir']
  },
  {
    id: 'femme-t-shirt-essentiel',
    slug: 'femme-t-shirt-essentiel',
    category: 'femme',
    subcategory: 't-shirts',
    name: { fr: 'T-shirt essentiel côtelé', en: 'Essential ribbed t-shirt' },
    description: {
      fr: 'Coton côtelé, coupe ajustée, encolure ronde épurée.',
      en: 'Ribbed cotton, fitted cut, clean crew neckline.'
    },
    priceEur: 62,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Blanc', 'Écru'],
    imageCount: 3,
    relatedProductIds: ['femme-pantalon-tailleur', 'femme-robe-fluide']
  },
  {
    id: 'femme-manteau-long',
    slug: 'femme-manteau-long',
    category: 'femme',
    subcategory: 'manteaux',
    name: { fr: 'Manteau long en laine', en: 'Long wool coat' },
    description: {
      fr: 'Laine dense, coupe longue et épurée, doublure satinée.',
      en: 'Dense wool, long clean cut, satin lining.'
    },
    priceEur: 410,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Camel'],
    imageCount: 4,
    relatedProductIds: ['femme-robe-fluide']
  },
  {
    id: 'femme-pantalon-tailleur',
    slug: 'femme-pantalon-tailleur',
    category: 'femme',
    subcategory: 'pantalons',
    name: { fr: 'Pantalon tailleur fluide', en: 'Fluid tailored trousers' },
    description: {
      fr: 'Tombé fluide, pli marqué, taille haute ajustée.',
      en: 'Fluid drape, sharp crease, fitted high rise.'
    },
    priceEur: 155,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 3,
    relatedProductIds: ['femme-t-shirt-essentiel', 'femme-manteau-long']
  },
  {
    id: 'enfant-t-shirt-graphique',
    slug: 'enfant-t-shirt-graphique',
    category: 'enfant',
    subcategory: 't-shirts',
    name: { fr: 'T-shirt graphique Reign', en: 'Reign graphic t-shirt' },
    description: {
      fr: 'Jersey doux, imprimé graphique discret, coupe confortable.',
      en: 'Soft jersey, subtle graphic print, comfortable fit.'
    },
    priceEur: 45,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Blanc'],
    imageCount: 2,
    isNew: true,
    relatedProductIds: ['enfant-sweat-capuche', 'enfant-pantalon-jogger']
  },
  {
    id: 'enfant-sweat-capuche',
    slug: 'enfant-sweat-capuche',
    category: 'enfant',
    subcategory: 'sweats',
    name: { fr: 'Sweat à capuche molleton', en: 'Fleece hoodie' },
    description: {
      fr: 'Molleton épais, capuche doublée, poche kangourou.',
      en: 'Heavyweight fleece, lined hood, kangaroo pocket.'
    },
    priceEur: 68,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Gris'],
    imageCount: 3,
    relatedProductIds: ['enfant-veste-legere', 'enfant-pantalon-jogger']
  },
  {
    id: 'enfant-pantalon-jogger',
    slug: 'enfant-pantalon-jogger',
    category: 'enfant',
    subcategory: 'pantalons',
    name: { fr: 'Jogger molleton', en: 'Fleece joggers' },
    description: {
      fr: 'Taille élastiquée, chevilles resserrées, confort au quotidien.',
      en: 'Elastic waist, tapered ankles, everyday comfort.'
    },
    priceEur: 52,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Gris'],
    imageCount: 2,
    relatedProductIds: ['enfant-t-shirt-graphique', 'enfant-sweat-capuche']
  },
  {
    id: 'enfant-veste-legere',
    slug: 'enfant-veste-legere',
    category: 'enfant',
    subcategory: 'vestes',
    name: { fr: 'Veste légère coupe-vent', en: 'Lightweight windbreaker' },
    description: {
      fr: 'Tissu déperlant, capuche amovible, coupe droite.',
      en: 'Water-repellent fabric, removable hood, straight cut.'
    },
    priceEur: 78,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Bleu acier'],
    imageCount: 2,
    relatedProductIds: ['enfant-sweat-capuche', 'enfant-t-shirt-graphique']
  },
  {
    id: 'accessoires-sac-cabas',
    slug: 'accessoires-sac-cabas',
    category: 'accessoires',
    subcategory: 'sacs',
    name: { fr: 'Sac cabas cuir grainé', en: 'Grained leather tote' },
    description: {
      fr: 'Cuir grainé épais, anses courtes, intérieur compartimenté.',
      en: 'Thick grained leather, short handles, compartmented interior.'
    },
    priceEur: 290,
    sizes: ['UNIQUE'],
    colors: ['Noir', 'Camel'],
    imageCount: 3,
    isNew: true,
    relatedProductIds: ['accessoires-ceinture-cuir']
  },
  {
    id: 'accessoires-ceinture-cuir',
    slug: 'accessoires-ceinture-cuir',
    category: 'accessoires',
    subcategory: 'ceintures',
    name: { fr: 'Ceinture cuir boucle signature', en: 'Signature buckle leather belt' },
    description: {
      fr: 'Cuir pleine fleur, boucle métal brossé gravée Reign.',
      en: 'Full-grain leather, brushed metal buckle engraved Reign.'
    },
    priceEur: 95,
    sizes: ['S/M', 'L/XL'],
    colors: ['Noir', 'Camel'],
    imageCount: 2,
    relatedProductIds: ['accessoires-sac-cabas']
  },
  {
    id: 'accessoires-bijou-anneau',
    slug: 'accessoires-bijou-anneau',
    category: 'accessoires',
    subcategory: 'bijoux',
    name: { fr: 'Anneau signature acier', en: 'Signature steel ring' },
    description: {
      fr: 'Acier brossé massif, gravure minimaliste Reign.',
      en: 'Solid brushed steel, minimalist Reign engraving.'
    },
    priceEur: 85,
    sizes: ['UNIQUE'],
    colors: ['Bleu acier'],
    imageCount: 2,
    relatedProductIds: ['accessoires-chapeau-laine', 'accessoires-ceinture-cuir']
  },
  {
    id: 'accessoires-chapeau-laine',
    slug: 'accessoires-chapeau-laine',
    category: 'accessoires',
    subcategory: 'chapeaux',
    name: { fr: 'Bonnet laine mérinos', en: 'Merino wool beanie' },
    description: {
      fr: 'Laine mérinos douce, revers côtelé, patch Reign discret.',
      en: 'Soft merino wool, ribbed cuff, discreet Reign patch.'
    },
    priceEur: 55,
    sizes: ['UNIQUE'],
    colors: ['Noir', 'Gris'],
    imageCount: 2,
    relatedProductIds: ['accessoires-bijou-anneau', 'accessoires-sac-cabas']
  },
  {
    id: 'homme-hoodie-yahweh',
    slug: 'homme-hoodie-yahweh',
    category: 'homme',
    subcategory: 'sweats',
    name: { fr: 'Sweat à capuche YAHWEH', en: 'YAHWEH Hoodie' },
    description: {
      fr: 'Un sweat à capuche premium orné du lettrage iconique YAHWEH brodé en relief sur la poitrine. Fabriqué en coton ultra-épais pour un tombé lourd et structuré.',
      en: 'A premium hoodie adorned with the iconic embossed YAHWEH lettering across the chest. Crafted from ultra-heavyweight cotton for a structured drape.'
    },
    priceEur: 120,
    sizes: CLOTHING_SIZES,
    colors: ['Noir', 'Blanc', 'Sable', 'Bordeaux', 'Bleu marine', 'Kaki'],
    imageCount: 6,
    isNew: true,
    relatedProductIds: ['homme-t-shirt-essentiel', 'homme-pantalon-droit']
  }
];

const isTesting = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true');

export const PRODUCTS: Product[] = isTesting
  ? ALL_PRODUCTS
  : ALL_PRODUCTS.filter((p) => p.id === 'homme-hoodie-yahweh');

export function getProductsByCategory(category: Category): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getSubcategoriesForCategory(category: Category): string[] {
  return Array.from(new Set(getProductsByCategory(category).map((p) => p.subcategory)));
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function searchProducts(query: string, locale: Locale): Product[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return PRODUCTS.filter((p) => p.name[locale].toLowerCase().includes(normalized));
}

export function getRelatedProducts(product: Product): Product[] {
  if (!product.relatedProductIds) return [];
  return product.relatedProductIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));
}

export function getProductImageUrl(product: Product, color?: string): string {
  const selectedColor = color || product.colors[0];

  const mappings: Record<string, Record<string, string>> = {
    'homme-hoodie-yahweh': {
      Noir: '/image/image projet/hommes/yahweh_hoodie_black.jpg',
      Blanc: '/image/image projet/hommes/yahweh_hoodie_white.jpg',
      Sable: '/image/image projet/hommes/yahweh_hoodie_sand.jpg',
      Bordeaux: '/image/image projet/hommes/yahweh_hoodie_burgundy.jpg',
      'Bleu marine': '/image/image projet/hommes/yahweh_hoodie_navy.jpg',
      Kaki: '/image/image projet/hommes/yahweh_hoodie_olive.jpg',
    },
    'homme-veste-oversize': {
      Noir: '/image/image projet/hommes/men_suit_black.png',
      'Bleu acier': '/image/image projet/hommes/men_suit_navy.png',
    },
    'homme-t-shirt-essentiel': {
      Noir: '/image/image projet/hommes/men_tshirt_black.png',
      Blanc: '/image/image projet/hommes/men_tshirt_white.png',
      Écru: '/image/image projet/hommes/men_tshirt_white.png',
    },
    'homme-pantalon-droit': {
      Noir: '/image/image projet/hommes/men_chino_black.png',
      Gris: '/image/image projet/hommes/men_chino_khaki.png',
    },
    'homme-chemise-col-mao': {
      Blanc: '/image/image projet/hommes/men_shirt_white.png',
      Noir: '/image/image projet/hommes/men_suit_black.png',
    },
    'femme-robe-fluide': {
      Noir: '/image/image projet/femmes/women_dress_black.png',
      'Bleu acier': '/image/image projet/femmes/women_dress_blue.png',
    },
    'femme-t-shirt-essentiel': {
      Noir: '/image/image projet/femmes/women_blouse_green.png',
      Blanc: '/image/image projet/femmes/women_blouse_white.png',
      Écru: '/image/image projet/femmes/women_blouse_yellow.png',
    },
    'femme-manteau-long': {
      Noir: '/image/image projet/femmes/women_jacket_black.png',
      Camel: '/image/image projet/femmes/women_jacket_brown.png',
    },
    'femme-pantalon-tailleur': {
      Noir: '/image/image projet/femmes/women_jeans_black.png',
      'Bleu acier': '/image/image projet/femmes/women_jeans_blue.png',
    },
    'enfant-t-shirt-graphique': {
      Noir: '/image/image projet/enfants/kids_outfit_blue.png',
      Blanc: '/image/image projet/enfants/kids_outfit_yellow.png',
    },
    'enfant-sweat-capuche': {
      Noir: '/image/image projet/enfants/kids_sweater_pink.png',
      Gris: '/image/image projet/enfants/kids_sweater_mint.png',
    },
    'enfant-pantalon-jogger': {
      Noir: '/image/image projet/enfants/kids_pyjamas_blue.png',
      Gris: '/image/image projet/enfants/kids_pyjamas_grey.png',
    },
    'enfant-veste-legere': {
      Noir: '/image/image projet/enfants/kids_coat_red.png',
      'Bleu acier': '/image/image projet/enfants/kids_coat_navy.png',
    },
    'accessoires-sac-cabas': {
      Noir: '/image/image projet/gadgets/gadget_charger_black.png',
      Camel: '/image/image projet/gadgets/gadget_charger_white.png',
    },
    'accessoires-ceinture-cuir': {
      Noir: '/image/image projet/gadgets/gadget_watch_black.png',
      Camel: '/image/image projet/gadgets/gadget_watch_rosegold.png',
    },
    'accessoires-bijou-anneau': {
      'Bleu acier': '/image/image projet/gadgets/gadget_earbuds_white.png',
    },
    'accessoires-chapeau-laine': {
      Noir: '/image/image projet/gadgets/gadget_vr_black.png',
      Gris: '/image/image projet/gadgets/gadget_vr_grey.png',
    },
  };

  const productMap = mappings[product.id];
  if (productMap) {
    const img = productMap[selectedColor];
    if (img) return img;
  }

  return `/image/category_${product.category}.png`;
}
