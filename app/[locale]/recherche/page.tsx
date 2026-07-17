import { getTranslations, setRequestLocale } from 'next-intl/server';
import { searchProducts } from '@/lib/catalog';
import { getLocalizedField } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n';

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
    <div>
      <h1>
        {t('resultsFor')} « {query} »
      </h1>
      {products.length === 0 ? (
        <p>{t('noResults')}</p>
      ) : (
        <ul>
          {products.map((product) => (
            <li key={product.id}>{getLocalizedField(product, 'name', locale)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
