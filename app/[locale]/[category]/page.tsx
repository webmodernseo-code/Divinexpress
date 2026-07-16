import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCategories, getProductsByCategory, SALE_SLUG } from '@/lib/catalog';
import { parseFilters, isFiltersPanelVisible, toggleFiltersPanelHref, parseSort, sortHref, SORT_OPTIONS } from '@/lib/filters';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { FilterPanel } from '@/components/FilterPanel/FilterPanel';
import { getLocalizedField } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

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

  const categories = await getCategories();
  const isKnownCategory =
    params.category === SALE_SLUG || categories.some((category) => category.slug === params.category);
  if (!isKnownCategory) notFound();

  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((v) => urlSearchParams.append(key, v));
    else if (value !== undefined) urlSearchParams.append(key, value);
  }

  const filters = parseFilters(urlSearchParams);
  const sort = parseSort(urlSearchParams);
  const products = await getProductsByCategory(params.category, filters, sort);
  const showFilters = isFiltersPanelVisible(urlSearchParams);
  const colorLabels: Record<string, string> = {
    Noir: t('colorBlack'),
    Blanc: t('colorWhite'),
    Gris: t('colorGrey'),
    Bleu: t('colorBlue')
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span>
          {products.length} {t('products')}
        </span>
        <div className={styles.sort}>
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.id}
              href={sortHref(urlSearchParams, option.id)}
              locale={locale}
              className={sort === option.id ? styles.sortActive : styles.sortOption}
            >
              {getLocalizedField(option, 'label', locale)}
            </Link>
          ))}
        </div>
        <Link href={toggleFiltersPanelHref(urlSearchParams)} locale={locale} className={styles.filterToggle}>
          {showFilters ? t('hideFilters') : t('showFilters')}
        </Link>
      </div>
      <div className={styles.layout}>
        {showFilters && (
          <FilterPanel
            filters={filters}
            searchParams={urlSearchParams}
            locale={locale}
            labels={{ size: t('size'), color: t('color'), price: t('price') }}
            colorLabels={colorLabels}
          />
        )}
        <div className={showFilters ? styles.gridWithFilters : styles.gridFull}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </div>
    </div>
  );
}
