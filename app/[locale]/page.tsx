import React from 'react';
import prisma from '@/lib/db';
import { BoutiqueClient } from '@/components/BoutiqueClient';

export default async function StorefrontPage() {
  // Fetch initial products and categories from database using Prisma
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      variants: true,
      images: true
    }
  });

  const categories = await prisma.category.findMany();

  // Map database data to fit storefront types
  const mappedProducts = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameFr: p.nameFr,
    nameEn: p.nameEn,
    descriptionFr: p.descriptionFr,
    descriptionEn: p.descriptionEn,
    featured: p.featured,
    categoryId: p.categoryId,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      priceCents: v.priceCents,
      compareAtPriceCents: v.compareAtPriceCents,
      stock: v.stock
    })),
    images: p.images.map((img) => ({
      url: img.url,
      alt: img.alt
    }))
  }));

  const mappedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug
  }));

  return (
    <BoutiqueClient
      initialProducts={mappedProducts}
      categories={mappedCategories}
    />
  );
}
