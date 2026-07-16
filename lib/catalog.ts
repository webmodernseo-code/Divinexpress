import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { priceRangesForBuckets, type ProductFilters, type SortId } from './filters';
import { isOnSale } from './pricing';

export const SALE_SLUG = 'sale';

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

function variantWhere(filters: ProductFilters): Prisma.ProductVariantWhereInput {
  const where: Prisma.ProductVariantWhereInput = {};
  if (filters.sizes.length > 0) where.size = { in: filters.sizes };
  if (filters.colors.length > 0) where.color = { in: filters.colors };
  if (filters.priceBuckets.length > 0) {
    const ranges = priceRangesForBuckets(filters.priceBuckets);
    where.OR = ranges.map(({ minCents, maxCents }) =>
      maxCents === null ? { priceCents: { gte: minCents } } : { priceCents: { gte: minCents, lte: maxCents } }
    );
  }
  return where;
}

const CATALOG_INCLUDE = {
  variants: true,
  images: true,
  category: true
} as const;

type ProductWithVariants = { variants: { priceCents: number }[] };

function cheapestPriceCents(product: ProductWithVariants): number {
  return product.variants.reduce((min, variant) => Math.min(min, variant.priceCents), Infinity);
}

// Prisma can't order a Product query by an aggregate (min/max) of a related
// list — only by _count. The catalog is small enough (seed: ~10 products,
// filtered subsets smaller still) that sorting the already-fetched page in
// memory is simpler and cheaper than a raw SQL workaround.
function sortProducts<T extends ProductWithVariants>(products: T[], sort: SortId): T[] {
  if (sort === 'nouveautes') return products;
  const sorted = [...products].sort((a, b) => cheapestPriceCents(a) - cheapestPriceCents(b));
  return sort === 'prix-asc' ? sorted : sorted.reverse();
}

export async function getProductsByCategory(categorySlug: string, filters: ProductFilters, sort: SortId = 'nouveautes') {
  const variants = variantWhere(filters);
  const hasVariantFilter = Object.keys(variants).length > 0;

  if (categorySlug === SALE_SLUG) {
    const products = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        variants: { some: { ...variants, compareAtPriceCents: { not: null } } }
      },
      include: CATALOG_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
    // The Prisma filter above is a coarse "has a compareAtPriceCents" check;
    // narrow to isOnSale's stricter rule (compareAtPriceCents > priceCents)
    // so a product only appears here if it actually renders as on-sale.
    const onSaleProducts = products.filter((product) => product.variants.some((variant) => isOnSale(variant)));
    return sortProducts(onSaleProducts, sort);
  }

  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      category: { slug: categorySlug },
      ...(hasVariantFilter ? { variants: { some: variants } } : {})
    },
    include: CATALOG_INCLUDE,
    orderBy: { createdAt: 'desc' }
  });
  return sortProducts(products, sort);
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: CATALOG_INCLUDE
  });
}

export async function searchProducts(query: string) {
  const trimmed = query.trim();
  if (trimmed === '') return [];

  return prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { nameFr: { contains: trimmed, mode: 'insensitive' } },
        { nameEn: { contains: trimmed, mode: 'insensitive' } },
        { descriptionFr: { contains: trimmed, mode: 'insensitive' } },
        { descriptionEn: { contains: trimmed, mode: 'insensitive' } }
      ]
    },
    include: CATALOG_INCLUDE,
    orderBy: { createdAt: 'desc' }
  });
}
