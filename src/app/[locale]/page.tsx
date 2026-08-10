import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata, breadcrumbJsonLd, SITE_URL } from '@/lib/seo';
import { HomeCollection } from '@/components/home/HomeCollection';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { PromoBanner } from '@/components/home/PromoBanner';
import { HomeFaq } from '@/components/home/HomeFaq';
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
      title: `${categoryName} — Reign`,
      description: categoryName
    });
  }

  const tHome = await getTranslations({ locale, namespace: 'home' });
  return buildMetadata({
    locale,
    pathname: '',
    title: `Reign — ${tHome('heroTitle')}`,
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
                  { name: 'Reign', url: `${SITE_URL}/${locale}` },
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
            image: '/image/hero_1.png',
            kicker: t('heroKicker'),
            title: t('heroTitle'),
            subtitle: t('heroSubtitle')
          },
          {
            image: '/image/hero_2.png',
            kicker: t('heroKicker2'),
            title: t('heroTitle2'),
            subtitle: t('heroSubtitle2')
          },
          {
            image: '/image/hero_3.png',
            kicker: t('heroKicker3'),
            title: t('heroTitle3'),
            subtitle: t('heroSubtitle3')
          }
        ]}
      />

      {/* Remounts when the Header navigates to a different category/subcategory. */}
      <HomeCollection
        key={`${initialCategory ?? 'all'}-${initialSubcategory ?? 'all'}`}
        initialCategory={initialCategory}
        initialSubcategory={initialSubcategory}
        products={products}
      />

      <PromoBanner />

      <HomeFaq />

      <section className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src="/image/hero_3.png"
          alt={t('editorialTitle')}
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-paper">
          <h2 className="max-w-2xl font-serif text-3xl md:text-4xl">{t('editorialTitle')}</h2>
          <p className="mt-4 max-w-xl text-sm md:text-base">{t('editorialBody')}</p>
        </div>
      </section>
    </>
  );
}
