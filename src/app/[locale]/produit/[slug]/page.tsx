import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { buildMetadata, breadcrumbJsonLd, productJsonLd, SITE_URL } from '@/lib/seo';
import { PRODUCTS, getProductBySlug, getRelatedProducts } from '@/lib/products';
import { routing } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { ProductDetailView } from '@/components/product/ProductDetailView';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => PRODUCTS.map((product) => ({ locale, slug: product.slug })));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const localizedLocale = locale as 'fr' | 'en';
  return buildMetadata({
    locale,
    pathname: `/produit/${slug}`,
    title: `${product.name[localizedLocale]} — Reign`,
    description: product.description[localizedLocale]
  });
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
  const tNav = await getTranslations('nav');
  const localizedLocale = locale as 'fr' | 'en';
  const productUrl = `${SITE_URL}/${locale}/produit/${product.slug}`;

  return (
    <Container className="py-10 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Reign', url: `${SITE_URL}/${locale}` },
              { name: tNav(product.category), url: `${SITE_URL}/${locale}?categorie=${product.category}` },
              { name: product.name[localizedLocale], url: productUrl }
            ])
          )
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd({
              name: product.name[localizedLocale],
              description: product.description[localizedLocale],
              url: productUrl,
              priceEur: product.priceEur,
              imageUrl: `${SITE_URL}/branding/logo-reign.png`
            })
          )
        }}
      />
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </Container>
  );
}
