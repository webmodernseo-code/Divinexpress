import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { PRICE_BUCKETS, toggleFilterValueHref, type ProductFilters } from '@/lib/filters';
import styles from './FilterPanel.module.css';

const SIZES = ['S', 'M', 'L', 'Unique'];
const COLORS = ['Noir', 'Blanc', 'Gris', 'Bleu'];

export function FilterPanel({
  filters,
  searchParams,
  locale,
  labels,
  colorLabels
}: {
  filters: ProductFilters;
  searchParams: URLSearchParams;
  locale: Locale;
  labels: { size: string; color: string; price: string };
  colorLabels: Record<string, string>;
}) {
  return (
    <aside className={styles.panel}>
      <div className={styles.group}>
        <div className={styles.groupTitle}>{labels.size}</div>
        {SIZES.map((size) => (
          <Link
            key={size}
            href={toggleFilterValueHref(searchParams, 'taille', size)}
            locale={locale}
            className={filters.sizes.includes(size) ? styles.optionActive : styles.option}
          >
            {size}
          </Link>
        ))}
      </div>
      <div className={styles.group}>
        <div className={styles.groupTitle}>{labels.color}</div>
        {COLORS.map((color) => (
          <Link
            key={color}
            href={toggleFilterValueHref(searchParams, 'couleur', color)}
            locale={locale}
            className={filters.colors.includes(color) ? styles.optionActive : styles.option}
          >
            {colorLabels[color] ?? color}
          </Link>
        ))}
      </div>
      <div className={styles.group}>
        <div className={styles.groupTitle}>{labels.price}</div>
        {PRICE_BUCKETS.map((bucket) => (
          <Link
            key={bucket.id}
            href={toggleFilterValueHref(searchParams, 'prix', bucket.id)}
            locale={locale}
            className={filters.priceBuckets.includes(bucket.id) ? styles.optionActive : styles.option}
          >
            {locale === 'fr' ? bucket.labelFr : bucket.labelEn}
          </Link>
        ))}
      </div>
    </aside>
  );
}
