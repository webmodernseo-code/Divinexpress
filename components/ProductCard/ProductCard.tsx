import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { formatPrice, isOnSale, cheapestVariant } from '@/lib/pricing';
import styles from './ProductCard.module.css';

export type ProductCardData = {
  slug: string;
  nameFr: string;
  nameEn: string;
  images: { url: string; alt: string }[];
  variants: { priceCents: number; compareAtPriceCents: number | null }[];
};

export function ProductCard({ product, locale }: { product: ProductCardData; locale: Locale }) {
  const name = locale === 'fr' ? product.nameFr : product.nameEn;
  const cheapest = cheapestVariant(product.variants);
  const onSale = cheapest ? isOnSale(cheapest) : false;
  const image = product.images[0];

  return (
    <Link href={`/produit/${product.slug}`} locale={locale} className={styles.card}>
      <div className={styles.imageWrap}>
        {image ? (
          <img src={image.url} alt={image.alt} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>Photo</div>
        )}
      </div>
      <div className={styles.name}>{name}</div>
      {cheapest && (
        <div className={styles.price}>
          {onSale && cheapest.compareAtPriceCents !== null ? (
            <>
              <span className={styles.priceStrike}>{formatPrice(cheapest.compareAtPriceCents, locale)}</span>{' '}
              <span className={styles.priceSale}>{formatPrice(cheapest.priceCents, locale)}</span>
            </>
          ) : (
            <span>{formatPrice(cheapest.priceCents, locale)}</span>
          )}
        </div>
      )}
    </Link>
  );
}
