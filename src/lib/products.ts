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
}

export const COLOR_SWATCHES: Record<string, string> = {
  Noir: '#0d0d0d',
  Blanc: '#ffffff',
  'Bleu acier': '#3b4a5a',
  Gris: '#808080',
  Écru: '#e6e2d8',
  Camel: '#a9744f'
};

/** Shared across Homme/Femme/Enfant so every clothing product uses the same pill selector. */
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const PRODUCTS: Product[] = [
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
  }
];

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
