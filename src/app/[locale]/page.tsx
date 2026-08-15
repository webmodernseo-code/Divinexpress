import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata, breadcrumbJsonLd, SITE_URL } from '@/lib/seo';
import { HomeCollection } from '@/components/home/HomeCollection';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { PromoBanner } from '@/components/home/PromoBanner';
import { HomeFaq } from '@/components/home/HomeFaq';
import { NewArrivalsCarousel } from '@/components/home/NewArrivalsCarousel';
import { CATEGORIES, getSubcategoriesForCategory, type Category } from '@/lib/products';
import { getCommerceDatabase } from '@/server/db/runtime';
import { StorefrontCatalog } from '@/server/catalog/storefront';

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const requestedCategory = typeof sp.categorie === 'string' ? sp.categorie : undefined;

  if (requestedCategory && CATEGORIES.includes(requestedCategory as Category)) {
    const tNav = await getTranslations({ locale, namespace: 'nav' });
    const categoryName = tNav(requestedCategory);
    return buildMetadata({
      locale,
      pathname: `?categorie=${requestedCategory}`,
      title: `Vêtements et accessoires ${categoryName} — DivinExpress`,
      description: `Découvrez la collection ${categoryName} de DivinExpress : vêtements et accessoires en ligne.`,
      keywords: [categoryName, `vêtements ${categoryName}`, `mode ${categoryName}`]
    });
  }

  const tHome = await getTranslations({ locale, namespace: 'home' });
  return buildMetadata({
    locale,
    pathname: '',
    title: `DivinExpress — ${tHome('heroTitle')}`,
    description: tHome('heroSubtitle')
  });
}

export default async function HomePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations('home');
  const products = await new StorefrontCatalog(await getCommerceDatabase()).list();

  // URL contract with the Header (Tâche 10): /?categorie=homme&sousCategorie=vestes
  const requestedCategory = typeof sp.categorie === 'string' ? sp.categorie : undefined;
  const initialCategory = CATEGORIES.includes(requestedCategory as Category)
    ? (requestedCategory as Category)
    : null;

  const requestedSubcategory = typeof sp.sousCategorie === 'string' ? sp.sousCategorie : undefined;
  const initialSubcategory =
    initialCategory &&
    requestedSubcategory &&
    getSubcategoriesForCategory(initialCategory).includes(requestedSubcategory)
      ? requestedSubcategory
      : null;

  const tNav = await getTranslations('nav');

  return (
    <>
      {initialCategory && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              breadcrumbJsonLd(
                [
                  { name: 'DivinExpress', url: `${SITE_URL}/${locale}` },
                  { name: tNav(initialCategory), url: `${SITE_URL}/${locale}?categorie=${initialCategory}` },
                  initialSubcategory
                    ? {
                        name: initialSubcategory,
                        url: `${SITE_URL}/${locale}?categorie=${initialCategory}&sousCategorie=${initialSubcategory}`
                      }
                    : null
                ].filter(Boolean) as { name: string; url: string }[]
              )
            )
          }}
        />
      )}
      <HeroCarousel
        slides={[
          {
            image: '/image/hero1.png',
            imageAlt: t('heroImageAlt1'),
            watermark: t('heroSlide1Watermark'),
            title: t('heroSlide1Title'),
            subtitle: t('heroSlide1Subtitle'),
            theme: 'navy'
          },
          {
            image: '/image/hero2.png',
            imageAlt: t('heroImageAlt2'),
            watermark: t('heroSlide2Watermark'),
            title: t('heroSlide2Title'),
            subtitle: t('heroSlide2Subtitle'),
            theme: 'black'
          },
          {
            image: '/image/hero3.png',
            imageAlt: t('heroImageAlt3'),
            watermark: t('heroSlide3Watermark'),
            title: t('heroSlide3Title'),
            subtitle: t('heroSlide3Subtitle'),
            theme: 'black'
          }
        ]}
        primaryCta={{ label: t('heroCtaPrimary'), href: '#collection' }}
        secondaryCta={{ label: t('heroCtaSecondary'), href: '#collection' }}
        features={[
          { icon: 'quality', title: t('feature1Title'), subtitle: t('feature1Subtitle') },
          { icon: 'design', title: t('feature2Title'), subtitle: t('feature2Subtitle') },
          { icon: 'shipping', title: t('feature3Title'), subtitle: t('feature3Subtitle') }
        ]}
      />

      {/* Remounts when the Header navigates to a different category/subcategory. */}
      <div id="collection" className="scroll-mt-28">
        <HomeCollection
          key={`${initialCategory ?? 'all'}-${initialSubcategory ?? 'all'}`}
          initialCategory={initialCategory}
          initialSubcategory={initialSubcategory}
          products={products}
        />
      </div>

      <PromoBanner />

      <HomeFaq />

      {/* Catalog is ordered oldest → newest by created_at, so the tail is the newest stock. */}
      <NewArrivalsCarousel
        title={t('newArrivalsTitle')}
        subtitle={t('newArrivalsSubtitle')}
        products={products.slice(-8).reverse()}
      />
    </>
  );
}
