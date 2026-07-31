import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PRODUCTS, getProductBySlug, getRelatedProducts } from '@/lib/products';
import { routing } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { ProductDetailView } from '@/components/product/ProductDetailView';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => PRODUCTS.map((product) => ({ locale, slug: product.slug })));
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product);

  return (
    <Container className="py-10 md:py-14">
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </Container>
  );
}
