import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { cheapestVariant, formatPrice, isOnSale } from '@/lib/pricing';
import { getLocalizedField } from '@/lib/i18n-utils';
import { Rating } from '../Rating/Rating';
import styles from './ProductCard.module.css';

export type ProductCardData = {
  slug: string;
  nameFr: string;
  nameEn: string;
  images: { url: string; alt: string }[];
  variants: { priceCents: number; compareAtPriceCents: number | null }[];
};

function getProductRating(slug: string): { value: number; count: number } {
  const ratings: Record<string, { value: number; count: number }> = {
    'eclipse-sneakers': { value: 4.3, count: 128 },
    'grvity-oxford': { value: 4.3, count: 96 },
    'flexora-boot': { value: 4.1, count: 64 },
    'boltrek-sports': { value: 4.3, count: 150 },
  };

  if (ratings[slug]) return ratings[slug];

  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const value = 4.0 + (Math.abs(hash) % 9) / 10;
  const count = 20 + (Math.abs(hash) % 180);
  return { value, count };
}

export function ProductCard({ product, locale }: { product: ProductCardData; locale: Locale }) {
  const name = getLocalizedField(product, 'name', locale);
  const cheapest = cheapestVariant(product.variants);
  const image = product.images[0];
  const ratingData = getProductRating(product.slug);

  return (
    <Link href={`/produit/${product.slug}`} locale={locale} className={styles.card}>
      <div className={styles.imageWrap}>
        {image ? (
          <img src={image.url} alt={image.alt} className={styles.image} />
        ) : (
          <div className={styles.placeholder} />
        )}
      </div>
      <div className={styles.name}>{name}</div>
      {cheapest && (
        <div className={styles.price}>
          {isOnSale(cheapest) && cheapest.compareAtPriceCents !== null ? (
            <>
              <span className={styles.priceStrike}>{formatPrice(cheapest.compareAtPriceCents, locale)}</span>
              <span className={styles.priceSale}>{formatPrice(cheapest.priceCents, locale)}</span>
            </>
          ) : (
            <span>{formatPrice(cheapest.priceCents, locale)}</span>
          )}
        </div>
      )}
      <div className={styles.ratingRow}>
        <Rating value={ratingData.value} id={product.slug} />
      </div>
    </Link>
  );
}
