import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCategories, getProductsByCategory, SALE_SLUG } from '@/lib/catalog';
import {
  parseFilters,
  isFiltersPanelVisible,
  toggleFiltersPanelHref,
  toggleFilterValueHref,
  parseSort,
  sortHref,
  SORT_OPTIONS,
  PRICE_BUCKETS
} from '@/lib/filters';
import { getLocalizedField } from '@/lib/i18n-utils';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

const AVAILABLE_SIZES = ['S', 'M', 'L', 'Unique'];
const AVAILABLE_COLORS = ['Noir', 'Blanc', 'Gris', 'Bleu'];

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: { locale: string; category: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('plp');
  const tHeader = await getTranslations('header');

  const categories = await getCategories();
  const isKnownCategory =
    params.category === 'boutique' ||
    params.category === 'shop' ||
    params.category === SALE_SLUG ||
    categories.some((category) => category.slug === params.category);

  if (!isKnownCategory) notFound();

  // Convert searchParams to URLSearchParams helper
  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => urlSearchParams.append(key, v));
    } else if (value !== undefined) {
      urlSearchParams.append(key, value);
    }
  }

  const filters = parseFilters(urlSearchParams);
  const sort = parseSort(urlSearchParams);
  const products = await getProductsByCategory(params.category, filters, sort);
  const showFilters = isFiltersPanelVisible(urlSearchParams);

  // Set localized details
  let title = '';
  let subtitle = '';
  if (params.category === 'boutique' || params.category === 'shop') {
    title = locale === 'fr' ? 'Découvrir la boutique' : 'Discover the Boutique';
    subtitle = locale === 'fr' 
      ? 'Explorez l\'ensemble de nos collections exclusives conçues pour le confort et le sport.' 
      : 'Explore all of our exclusive collections designed for comfort and sports.';
  } else if (params.category === SALE_SLUG) {
    title = locale === 'fr' ? 'Offres & Promotions' : 'Special Offers';
    subtitle = locale === 'fr' 
      ? 'Les meilleures réductions sur une sélection d\'articles techniques.' 
      : 'The best deals on a selection of technical sportswear.';
  } else {
    const matched = categories.find((c) => c.slug === params.category);
    title = matched ? (locale === 'fr' ? matched.name : matched.name) : params.category;
    if (params.category === 'homme') {
      subtitle = locale === 'fr' ? 'Performance et style pour hommes actifs.' : 'Performance and style for active men.';
    } else if (params.category === 'femme') {
      subtitle = locale === 'fr' ? 'Confort et design pour femmes inspirées.' : 'Comfort and design for inspired women.';
    } else {
      subtitle = locale === 'fr' ? 'Garde-robe robuste et flexible pour enfants.' : 'Sturdy and flexible wardrobe for kids.';
    }
  }

  const isBoutiquePage = params.category === 'boutique' || params.category === 'shop';
  const resetHref = `/${params.category}` + (showFilters ? '' : '?filtres=masques');

  return (
    <main className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/" locale={locale} className={styles.crumb}>
          {tHeader('home')}
        </Link>
        <span className={styles.crumbSep}>/</span>
        {isBoutiquePage ? (
          <span className={styles.crumbActive}>{title}</span>
        ) : (
          <>
            <Link href="/boutique" locale={locale} className={styles.crumb}>
              {locale === 'fr' ? 'Boutique' : 'Shop'}
            </Link>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbActive}>{title}</span>
          </>
        )}
      </nav>

      {/* Hero Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      {/* Controls Bar */}
      <div className={styles.controls}>
        <div className={styles.count}>
          {products.length} {t('products')}
        </div>

        <div className={styles.actions}>
          <Link href={toggleFiltersPanelHref(urlSearchParams)} locale={locale} className={styles.filterToggle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>{showFilters ? t('hideFilters') : t('showFilters')}</span>
          </Link>

          <div className={styles.sortOptions}>
            {SORT_OPTIONS.map((option) => {
              const isActive = sort === option.id;
              return (
                <Link
                  key={option.id}
                  href={sortHref(urlSearchParams, option.id)}
                  locale={locale}
                  className={isActive ? styles.sortBtnActive : styles.sortBtn}
                >
                  {getLocalizedField(option, 'label', locale)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Catalog Layout */}
      <div className={styles.layout}>
        {/* Sidebar Filters */}
        {showFilters && (
          <aside className={styles.sidebar}>
            {/* Category selection (if in Boutique) */}
            {isBoutiquePage && (
              <div className={styles.filterGroup}>
                <h3 className={styles.filterHeading}>Catégories</h3>
                <div className={styles.categoryLinks}>
                  {categories.map((c) => (
                    <Link key={c.slug} href={`/${c.slug}`} locale={locale} className={styles.categoryLink}>
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            <div className={styles.filterGroup}>
              <h3 className={styles.filterHeading}>{locale === 'fr' ? 'Tailles' : 'Sizes'}</h3>
              <div className={styles.sizesGrid}>
                {AVAILABLE_SIZES.map((size) => {
                  const isActive = filters.sizes.includes(size);
                  return (
                    <Link
                      key={size}
                      href={toggleFilterValueHref(urlSearchParams, 'taille', size)}
                      locale={locale}
                      className={isActive ? styles.sizePillActive : styles.sizePill}
                    >
                      {size}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div className={styles.filterGroup}>
              <h3 className={styles.filterHeading}>{locale === 'fr' ? 'Couleurs' : 'Colors'}</h3>
              <div className={styles.colorsList}>
                {AVAILABLE_COLORS.map((color) => {
                  const isActive = filters.colors.includes(color);
                  return (
                    <Link
                      key={color}
                      href={toggleFilterValueHref(urlSearchParams, 'couleur', color)}
                      locale={locale}
                      className={isActive ? styles.colorRowActive : styles.colorRow}
                    >
                      <span
                        className={styles.colorDot}
                        style={{
                          background:
                            color === 'Noir'
                              ? '#000000'
                              : color === 'Blanc'
                              ? '#ffffff'
                              : color === 'Gris'
                              ? '#888888'
                              : '#2563eb',
                          border: color === 'Blanc' ? '1px solid #ddd' : 'none'
                        }}
                      />
                      <span>{locale === 'fr' ? color : color === 'Noir' ? 'Black' : color === 'Blanc' ? 'White' : color === 'Gris' ? 'Grey' : 'Blue'}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Price ranges */}
            <div className={styles.filterGroup}>
              <h3 className={styles.filterHeading}>{locale === 'fr' ? 'Budget' : 'Price'}</h3>
              <div className={styles.priceList}>
                {PRICE_BUCKETS.map((bucket) => {
                  const isActive = filters.priceBuckets.includes(bucket.id);
                  return (
                    <Link
                      key={bucket.id}
                      href={toggleFilterValueHref(urlSearchParams, 'prix', bucket.id)}
                      locale={locale}
                      className={isActive ? styles.priceRowActive : styles.priceRow}
                    >
                      <span className={isActive ? styles.checkboxActive : styles.checkbox} />
                      <span>{locale === 'fr' ? bucket.labelFr : bucket.labelEn}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Reset Filters */}
            {(filters.sizes.length > 0 || filters.colors.length > 0 || filters.priceBuckets.length > 0) && (
              <Link href={resetHref} locale={locale} className={styles.resetBtn}>
                {locale === 'fr' ? 'Réinitialiser les filtres' : 'Reset Filters'}
              </Link>
            )}
          </aside>
        )}

        {/* Product Grid */}
        <div className={showFilters ? styles.gridWithSidebar : styles.gridFullWidth}>
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))
          ) : (
            <div className={styles.noResults}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <h3>{locale === 'fr' ? 'Aucun résultat trouvé' : 'No results found'}</h3>
              <p>
                {locale === 'fr'
                  ? 'Essayez de modifier vos filtres pour découvrir d\'autres modèles.'
                  : 'Try modifying your filters to discover other models.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
