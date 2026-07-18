import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getProductBySlug } from '@/lib/catalog';
import type { Locale } from '@/i18n';
import { ProductDetailClient } from '@/components/ProductDetail/ProductDetailClient';

export default async function ProductPage({ params }: { params: { locale: string; slug: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;

  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  return <ProductDetailClient product={product as any} locale={locale} />;
}
