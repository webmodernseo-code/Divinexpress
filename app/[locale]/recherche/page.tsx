import { getTranslations, setRequestLocale } from 'next-intl/server';
import { searchProducts } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

export default async function SearchPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { q?: string | string[] };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('search');
  
  const rawQuery = searchParams.q;
  const query = Array.isArray(rawQuery) ? rawQuery[0] ?? '' : rawQuery ?? '';
  const products = await searchProducts(query);

  return (
    <main className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a href="/" className={styles.crumb}>
          {locale === 'fr' ? 'Accueil' : 'Home'}
        </a>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbActive}>
          {locale === 'fr' ? 'Recherche' : 'Search'}
        </span>
      </nav>

      {/* Hero Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          {locale === 'fr' ? 'Résultats de recherche' : 'Search Results'}
        </h1>
        <p className={styles.subtitle}>
          {query.trim() !== '' ? (
            locale === 'fr' 
              ? `${products.length} résultats trouvés pour « ${query} »` 
              : `${products.length} results found for "${query}"`
          ) : (
            locale === 'fr' ? 'Saisissez votre recherche ci-dessous.' : 'Enter your search query below.'
          )}
        </p>
      </header>

      {/* Search Again Bar */}
      <div className={styles.searchBarWrap}>
        <form action={`/${locale}/recherche`} method="GET" className={styles.searchForm}>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder={locale === 'fr' ? 'Rechercher un modèle, une couleur...' : 'Search for a model, color...'}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>
      </div>

      {/* Results grid */}
      <section className={styles.resultsSection}>
        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <h3>{locale === 'fr' ? 'Aucun résultat' : 'No results found'}</h3>
            <p>
              {locale === 'fr'
                ? 'Essayez de chercher un autre mot-clé (par exemple "veste", "short", "legging", "noir").'
                : 'Try searching for another keyword (e.g. "jacket", "short", "legging", "black").'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
