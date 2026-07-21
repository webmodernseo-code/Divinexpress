import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/adminAuth';

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
  featured?: boolean;
  imageUrl?: string;
  variants: SeedVariant[];
};

const categories = [
  { name: 'Homme', slug: 'homme' },
  { name: 'Femme', slug: 'femme' },
  { name: 'Enfant', slug: 'enfant' }
];

const products: SeedProduct[] = [
  {
    slug: 'veste-wax-noire',
    nameFr: 'Veste wax noire',
    nameEn: 'Black wax jacket',
    descriptionFr: 'Veste en wax premium, coupe ajustée, idéale pour les sorties élégantes.',
    descriptionEn: 'Premium wax jacket, fitted cut, ideal for elegant outings.',
    categorySlug: 'homme',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&auto=format&fit=crop&q=80',
    variants: [
      { sku: 'VWN-M-BLK', size: 'M', color: 'Noir', priceCents: 8900, stock: 12 },
      { sku: 'VWN-L-BLK', size: 'L', color: 'Noir', priceCents: 8900, stock: 8 }
    ]
  },
  {
    slug: 'tshirt-technique-blanc-homme',
    nameFr: 'T-shirt technique blanc',
    nameEn: 'White technical t-shirt',
    descriptionFr: 'T-shirt respirant, coupe droite, parfait pour les sessions de running.',
    descriptionEn: 'Breathable t-shirt, straight cut, perfect for running sessions.',
    categorySlug: 'homme',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
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
    descriptionFr: 'Short léger, doublure intérieure confortable et matière séchant rapidement.',
    descriptionEn: 'Lightweight shorts, comfortable inner lining and quick-drying fabric.',
    categorySlug: 'homme',
    imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
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
    descriptionFr: 'Legging taille haute, maintien fort, idéal pour le fitness et le running.',
    descriptionEn: 'High-waist leggings, strong support, ideal for fitness and running.',
    categorySlug: 'femme',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=600&auto=format&fit=crop&q=80',
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
    descriptionFr: 'Maintien moyen, bretelles ajustables, tissu respirant anti-humidité.',
    descriptionEn: 'Medium support, adjustable straps, moisture-wicking breathable fabric.',
    categorySlug: 'femme',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop&q=80',
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
    descriptionFr: 'Coupe-vent léger, capuche amovible, idéal contre les pluies fines.',
    descriptionEn: 'Lightweight windbreaker, removable hood, ideal against light rain.',
    categorySlug: 'femme',
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80',
    variants: [
      { sku: 'VCB-S-BLU', size: 'S', color: 'Bleu', priceCents: 7500, stock: 10 },
      { sku: 'VCB-M-BLU', size: 'M', color: 'Bleu', priceCents: 7500, stock: 7 }
    ]
  },
  {
    slug: 'coupe-vent-running-bleu',
    nameFr: 'Coupe-vent running bleu',
    nameEn: 'Blue running windbreaker',
    descriptionFr: 'Ultra-léger, poche zippée au dos, matière coupe-vent et déperlante.',
    descriptionEn: 'Ultra-lightweight, zipped back pocket, windproof and water-repellent fabric.',
    categorySlug: 'enfant',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&auto=format&fit=crop&q=80',
    variants: [
      { sku: 'CVR-M-BLU', size: 'M', color: 'Bleu', priceCents: 7900, stock: 9 },
      { sku: 'CVR-L-BLU', size: 'L', color: 'Bleu', priceCents: 7900, stock: 5 }
    ]
  },
  {
    slug: 'chaussettes-running-techniques',
    nameFr: 'Chaussettes running techniques',
    nameEn: 'Technical running socks',
    descriptionFr: 'Anti-ampoules, renforts talons et orteils, évacuation de la transpiration.',
    descriptionEn: 'Blister-resistant, reinforced heel and toe, sweat-wicking properties.',
    categorySlug: 'enfant',
    imageUrl: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=600&auto=format&fit=crop&q=80',
    variants: [
      { sku: 'CRT-U-BLK', size: 'Unique', color: 'Noir', priceCents: 1500, stock: 40 }
    ]
  },
  {
    slug: 'casquette-running-noire',
    nameFr: 'Casquette running noire',
    nameEn: 'Black running cap',
    descriptionFr: 'Légère, réglable par scratch, tissu technique respirant séchant vite.',
    descriptionEn: 'Lightweight, adjustable velcro, quick-drying breathable technical fabric.',
    categorySlug: 'enfant',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80',
    variants: [
      { sku: 'CRN-U-BLK', size: 'Unique', color: 'Noir', priceCents: 1600, compareAtPriceCents: 2200, stock: 22 }
    ]
  },
  {
    slug: 'sac-banane-running-noir',
    nameFr: 'Sac banane running noir',
    nameEn: 'Black running belt bag',
    descriptionFr: 'Compartiment étanche pour téléphone et clés, ceinture réglable élastique.',
    descriptionEn: 'Water-resistant phone and keys compartment, elastic adjustable belt.',
    categorySlug: 'enfant',
    imageUrl: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80',
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
      update: {
        featured: product.featured ?? false,
        nameFr: product.nameFr,
        nameEn: product.nameEn,
        descriptionFr: product.descriptionFr,
        descriptionEn: product.descriptionEn,
        images: {
          deleteMany: {},
          create: [{ url: product.imageUrl || '/placeholder-product.svg', alt: product.nameFr }]
        }
      },
      create: {
        slug: product.slug,
        nameFr: product.nameFr,
        nameEn: product.nameEn,
        descriptionFr: product.descriptionFr,
        descriptionEn: product.descriptionEn,
        status: 'PUBLISHED',
        featured: product.featured ?? false,
        categoryId,
        variants: { create: product.variants },
        images: {
          create: [{ url: product.imageUrl || '/placeholder-product.svg', alt: product.nameFr }]
        }
      }
    });
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (adminEmail && adminPassword) {
    await prisma.admin.upsert({
      where: { email: adminEmail },
      update: { passwordHash: hashPassword(adminPassword) },
      create: { email: adminEmail, passwordHash: hashPassword(adminPassword), role: 'admin' }
    });
    console.log(`Admin account ready: ${adminEmail}`);
  } else {
    console.log('ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD not set — skipping admin account seed.');
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
