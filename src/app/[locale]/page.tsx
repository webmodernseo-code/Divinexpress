import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata, breadcrumbJsonLd, SITE_URL } from '@/lib/seo';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';
import { HomeCollection } from '@/components/home/HomeCollection';
import { PromoBanner } from '@/components/home/PromoBanner';
import { HomeFaq } from '@/components/home/HomeFaq';
import { CATEGORIES, getSubcategoriesForCategory, type Category } from '@/lib/products';

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
      <section className="relative">
        <PlaceholderBlock aspect="wide" className="w-full" />
        <div className="absolute inset-0 flex flex-col items-start justify-end bg-linear-to-b from-ink/10 to-ink/60 p-8 text-paper md:p-16">
          <p className="text-xs uppercase tracking-[0.3em]">{t('heroKicker')}</p>
          <h1 className="mt-4 max-w-xl font-serif text-3xl md:text-6xl">{t('heroTitle')}</h1>
          <p className="mt-4 max-w-md text-sm text-paper/85 md:text-base">{t('heroSubtitle')}</p>
        </div>
      </section>

      {/* Remounts when the Header navigates to a different category/subcategory. */}
      <HomeCollection
        key={`${initialCategory ?? 'all'}-${initialSubcategory ?? 'all'}`}
        initialCategory={initialCategory}
        initialSubcategory={initialSubcategory}
      />

      <PromoBanner />

      <HomeFaq />

      <section className="relative">
        <PlaceholderBlock aspect="wide" className="w-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-paper">
          <h2 className="max-w-2xl font-serif text-3xl md:text-4xl">{t('editorialTitle')}</h2>
          <p className="mt-4 max-w-xl text-sm md:text-base">{t('editorialBody')}</p>
        </div>
      </section>
    </>
  );
}
