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
    <div className={styles.page}>
      <h1 className={styles.heading}>
        {t('resultsFor')} « {query} »
      </h1>
      {products.length === 0 ? (
        <p className={styles.empty}>{t('noResults')}</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
