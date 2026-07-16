import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedVariant = {
  sku: string;
  size: string;
  color: string;
  priceCents: number;
  compareAtPriceCents?: number;
  stock: number;
};

type SeedProduct = {
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  categorySlug: string;
  variants: SeedVariant[];
};

const categories = [
  { name: 'Homme', slug: 'homme' },
  { name: 'Femme', slug: 'femme' },
  { name: 'Running', slug: 'running' }
];

const products: SeedProduct[] = [
  {
    slug: 'veste-wax-noire',
    nameFr: 'Veste wax noire',
    nameEn: 'Black wax jacket',
    descriptionFr: 'Veste en wax premium, coupe ajustée.',
    descriptionEn: 'Premium wax jacket, fitted cut.',
    categorySlug: 'homme',
    variants: [
      { sku: 'VWN-M-BLK', size: 'M', color: 'Noir', priceCents: 8900, stock: 12 },
      { sku: 'VWN-L-BLK', size: 'L', color: 'Noir', priceCents: 8900, stock: 8 }
    ]
  },
  {
    slug: 'tshirt-technique-blanc-homme',
    nameFr: 'T-shirt technique blanc',
    nameEn: 'White technical t-shirt',
    descriptionFr: 'T-shirt respirant, coupe droite.',
    descriptionEn: 'Breathable t-shirt, straight cut.',
    categorySlug: 'homme',
    variants: [
      { sku: 'TTB-S-WHT', size: 'S', color: 'Blanc', priceCents: 2900, stock: 20 },
      { sku: 'TTB-M-WHT', size: 'M', color: 'Blanc', priceCents: 2900, stock: 18 },
      { sku: 'TTB-L-WHT', size: 'L', color: 'Blanc', priceCents: 2900, stock: 10 }
    ]
  },
  {
    slug: 'short-running-gris-homme',
    nameFr: 'Short running gris',
    nameEn: 'Grey running shorts',
    descriptionFr: 'Short léger, doublure intérieure.',
    descriptionEn: 'Lightweight shorts, inner lining.',
    categorySlug: 'homme',
    variants: [
      { sku: 'SRG-S-GRY', size: 'S', color: 'Gris', priceCents: 3200, compareAtPriceCents: 4500, stock: 15 },
      { sku: 'SRG-M-GRY', size: 'M', color: 'Gris', priceCents: 3200, compareAtPriceCents: 4500, stock: 9 },
      { sku: 'SRG-L-GRY', size: 'L', color: 'Gris', priceCents: 3200, compareAtPriceCents: 4500, stock: 3 }
    ]
  },
  {
    slug: 'legging-performance-noir-femme',
    nameFr: 'Legging performance noir',
    nameEn: 'Black performance leggings',
    descriptionFr: 'Legging taille haute, maintien fort.',
    descriptionEn: 'High-waist leggings, strong support.',
    categorySlug: 'femme',
    variants: [
      { sku: 'LPN-S-BLK', size: 'S', color: 'Noir', priceCents: 5500, stock: 14 },
      { sku: 'LPN-M-BLK', size: 'M', color: 'Noir', priceCents: 5500, stock: 11 },
      { sku: 'LPN-L-BLK', size: 'L', color: 'Noir', priceCents: 5500, stock: 6 }
    ]
  },
  {
    slug: 'brassiere-sport-blanche-femme',
    nameFr: 'Brassière sport blanche',
    nameEn: 'White sports bra',
    descriptionFr: 'Maintien moyen, bretelles ajustables.',
    descriptionEn: 'Medium support, adjustable straps.',
    categorySlug: 'femme',
    variants: [
      { sku: 'BSB-S-WHT', size: 'S', color: 'Blanc', priceCents: 2500, compareAtPriceCents: 3500, stock: 17 },
      { sku: 'BSB-M-WHT', size: 'M', color: 'Blanc', priceCents: 2500, compareAtPriceCents: 3500, stock: 13 },
      { sku: 'BSB-L-WHT', size: 'L', color: 'Blanc', priceCents: 2500, compareAtPriceCents: 3500, stock: 4 }
    ]
  },
  {
    slug: 'veste-coupe-vent-bleue-femme',
    nameFr: 'Veste coupe-vent bleue',
    nameEn: 'Blue windbreaker jacket',
    descriptionFr: 'Coupe-vent léger, capuche amovible.',
    descriptionEn: 'Lightweight windbreaker, removable hood.',
    categorySlug: 'femme',
    variants: [
      { sku: 'VCB-S-BLU', size: 'S', color: 'Bleu', priceCents: 7500, stock: 10 },
      { sku: 'VCB-M-BLU', size: 'M', color: 'Bleu', priceCents: 7500, stock: 7 }
    ]
  },
  {
    slug: 'coupe-vent-running-bleu',
    nameFr: 'Coupe-vent running bleu',
    nameEn: 'Blue running windbreaker',
    descriptionFr: 'Ultra-léger, poche zippée dos.',
    descriptionEn: 'Ultra-lightweight, zipped back pocket.',
    categorySlug: 'running',
    variants: [
      { sku: 'CVR-M-BLU', size: 'M', color: 'Bleu', priceCents: 7900, stock: 9 },
      { sku: 'CVR-L-BLU', size: 'L', color: 'Bleu', priceCents: 7900, stock: 5 }
    ]
  },
  {
    slug: 'chaussettes-running-techniques',
    nameFr: 'Chaussettes running techniques',
    nameEn: 'Technical running socks',
    descriptionFr: 'Anti-ampoules, taille unique.',
    descriptionEn: 'Blister-resistant, one size.',
    categorySlug: 'running',
    variants: [
      { sku: 'CRT-U-BLK', size: 'Unique', color: 'Noir', priceCents: 1500, stock: 40 }
    ]
  },
  {
    slug: 'casquette-running-noire',
    nameFr: 'Casquette running noire',
    nameEn: 'Black running cap',
    descriptionFr: 'Légère, réglable, tissu respirant.',
    descriptionEn: 'Lightweight, adjustable, breathable fabric.',
    categorySlug: 'running',
    variants: [
      { sku: 'CRN-U-BLK', size: 'Unique', color: 'Noir', priceCents: 1600, compareAtPriceCents: 2200, stock: 22 }
    ]
  },
  {
    slug: 'sac-banane-running-noir',
    nameFr: 'Sac banane running noir',
    nameEn: 'Black running belt bag',
    descriptionFr: 'Compartiment étanche pour téléphone.',
    descriptionEn: 'Water-resistant phone compartment.',
    categorySlug: 'running',
    variants: [
      { sku: 'SBR-U-BLK', size: 'Unique', color: 'Noir', priceCents: 2800, stock: 16 }
    ]
  }
];

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category
    });
    categoryIds.set(category.slug, row.id);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${product.categorySlug}`);

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        slug: product.slug,
        nameFr: product.nameFr,
        nameEn: product.nameEn,
        descriptionFr: product.descriptionFr,
        descriptionEn: product.descriptionEn,
        status: 'PUBLISHED',
        categoryId,
        variants: { create: product.variants },
        images: {
          create: [{ url: '/placeholder-product.svg', alt: product.nameFr }]
        }
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
