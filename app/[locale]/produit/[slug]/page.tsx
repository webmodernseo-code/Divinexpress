import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getProductBySlug } from '@/lib/catalog';
import { prisma } from '@/lib/prisma';
import type { Locale } from '@/i18n';
import { ProductDetailClient } from '@/components/ProductDetail/ProductDetailClient';

export default async function ProductPage({ params }: { params: { locale: string; slug: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;

  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const similarProducts = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      categoryId: product.categoryId,
      NOT: { id: product.id }
    },
    include: {
      variants: true,
      images: true,
      category: true
    },
    take: 4
  });

  return <ProductDetailClient product={product as any} similarProducts={similarProducts as any} locale={locale} />;
}
