import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { buildMetadata, breadcrumbJsonLd, productJsonLd, SITE_URL } from '@/lib/seo';
import { Container } from '@/components/ui/Container';
import { ProductDetailView } from '@/components/product/ProductDetailView';
import { getCommerceDatabase } from '@/server/db/runtime';
import { StorefrontCatalog } from '@/server/catalog/storefront';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await new StorefrontCatalog(await getCommerceDatabase()).findBySlug(slug);
  if (!product) return {};
  const localizedLocale = locale as 'fr' | 'en';
  return buildMetadata({
    locale,
    pathname: `/produit/${slug}`,
    title: `${product.name[localizedLocale]} — DivinExpress`,
    description: product.description[localizedLocale]
  });
}

export default async function ProductPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ couleur?: string }>;
}) {
  const { locale, slug } = await params;
  const { couleur } = await searchParams;
  setRequestLocale(locale);

  const catalog = new StorefrontCatalog(await getCommerceDatabase());
  const product = await catalog.findBySlug(slug);
  if (!product) {
    notFound();
  }

  const relatedProducts = product.relatedProductIds?.length
    ? (await catalog.list()).filter((candidate) => product.relatedProductIds?.includes(candidate.id))
    : [];
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
              { name: 'DivinExpress', url: `${SITE_URL}/${locale}` },
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
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        initialColor={couleur && product.colors.includes(couleur) ? couleur : undefined}
      />
    </Container>
  );
}
