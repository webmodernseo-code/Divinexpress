import type { Locale } from '@/i18n';
import { formatPrice } from '@/lib/pricing';
import styles from './PriceDisplay.module.css';

type PriceDisplayProps = {
  priceCents: number;
  compareAtPriceCents: number | null;
  locale: Locale;
  className?: string;
};

export function PriceDisplay({ priceCents, compareAtPriceCents, locale, className }: PriceDisplayProps) {
  const onSale = compareAtPriceCents !== null && compareAtPriceCents > priceCents;

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {onSale && compareAtPriceCents !== null ? (
        <>
          <span className={styles.strike}>{formatPrice(compareAtPriceCents, locale)}</span>{' '}
          <span className={styles.sale}>{formatPrice(priceCents, locale)}</span>
        </>
      ) : (
        <span>{formatPrice(priceCents, locale)}</span>
      )}
    </div>
  );
}
