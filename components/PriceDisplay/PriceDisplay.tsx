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
  
  let discountPercent = 0;
  if (onSale && compareAtPriceCents) {
    discountPercent = Math.round(((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100);
  }

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {onSale && compareAtPriceCents !== null ? (
        <>
          <span className={styles.strike}>{formatPrice(compareAtPriceCents, locale)}</span>{' '}
          <span className={styles.sale}>{formatPrice(priceCents, locale)}</span>
          <span className={styles.discountBadge}>{discountPercent}% de réduction</span>
        </>
      ) : (
        <span>{formatPrice(priceCents, locale)}</span>
      )}
    </div>
  );
}
