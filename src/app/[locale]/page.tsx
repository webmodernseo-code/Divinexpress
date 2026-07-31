import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';
import { HomeCollection } from '@/components/home/HomeCollection';
import { PromoBanner } from '@/components/home/PromoBanner';
import { HomeFaq } from '@/components/home/HomeFaq';
import { CATEGORIES, getSubcategoriesForCategory, type Category } from '@/lib/products';

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

  return (
    <>
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
