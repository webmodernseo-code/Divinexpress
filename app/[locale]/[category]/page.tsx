import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCategories, getProductsByCategory, SALE_SLUG } from '@/lib/catalog';
import { parseFilters, isFiltersPanelVisible, toggleFiltersPanelHref, parseSort, sortHref, SORT_OPTIONS } from '@/lib/filters';
import { getLocalizedField } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n';

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

  return (
    <div>
      <p>
        {products.length} {t('products')}
      </p>
      <div>
        {SORT_OPTIONS.map((option) => (
          <Link key={option.id} href={sortHref(urlSearchParams, option.id)} locale={locale}>
            {sort === option.id ? `[${getLocalizedField(option, 'label', locale)}]` : getLocalizedField(option, 'label', locale)}
          </Link>
        ))}
      </div>
      <Link href={toggleFiltersPanelHref(urlSearchParams)} locale={locale}>
        {showFilters ? t('hideFilters') : t('showFilters')}
      </Link>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{getLocalizedField(product, 'name', locale)}</li>
        ))}
      </ul>
    </div>
  );
}
