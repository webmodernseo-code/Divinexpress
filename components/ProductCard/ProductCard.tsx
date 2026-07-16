import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { cheapestVariant } from '@/lib/pricing';
import { getLocalizedField } from '@/lib/i18n-utils';
import { PriceDisplay } from '../PriceDisplay/PriceDisplay';
import styles from './ProductCard.module.css';

export type ProductCardData = {
  slug: string;
  nameFr: string;
  nameEn: string;
  images: { url: string; alt: string }[];
  variants: { priceCents: number; compareAtPriceCents: number | null }[];
};

export function ProductCard({ product, locale }: { product: ProductCardData; locale: Locale }) {
  const name = getLocalizedField(product, 'name', locale);
  const cheapest = cheapestVariant(product.variants);
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
        <PriceDisplay
          priceCents={cheapest.priceCents}
          compareAtPriceCents={cheapest.compareAtPriceCents}
          locale={locale}
          className={styles.price}
        />
      )}
    </Link>
  );
}
