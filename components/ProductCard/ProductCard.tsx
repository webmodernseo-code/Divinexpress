'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { cheapestVariant } from '@/lib/pricing';
import { getLocalizedField } from '@/lib/i18n-utils';
import { matchVariant, type ProductFilters } from '@/lib/filters';
import { PriceDisplay } from '../PriceDisplay/PriceDisplay';
import styles from './ProductCard.module.css';

export type ProductCardData = {
  slug: string;
  nameFr: string;
  nameEn: string;
  images: { url: string; alt: string }[];
  variants: { size: string; color: string; priceCents: number; compareAtPriceCents: number | null }[];
};

const COLOR_MAP: Record<string, string> = {
  'Noir': '#000000',
  'Blanc': '#ffffff',
  'Gris': '#888888',
  'Bleu': '#0000ff'
};

export function ProductCard({
  product,
  locale,
  filters
}: {
  product: ProductCardData;
  locale: Locale;
  filters?: ProductFilters;
}) {
  const name = getLocalizedField(product, 'name', locale);
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  
  // Set initial selected color to first filter color or product default
  const initialColor = (filters?.colors && filters.colors.length > 0 && colors.includes(filters.colors[0]))
    ? filters.colors[0]
    : (colors[0] || null);

  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor);

  const matchedVariants = product.variants.filter((variant) => {
    const customFilters = {
      ...(filters ?? { sizes: [], colors: [], priceBuckets: [] }),
      colors: selectedColor ? [selectedColor] : []
    };
    return matchVariant(variant, customFilters);
  });

  const variantsToUse = matchedVariants.length > 0 ? matchedVariants : product.variants;
  const cheapest = cheapestVariant(variantsToUse);
  const image = product.images[0];
  
  const hasSale = product.variants.some(v => v.compareAtPriceCents !== null && v.compareAtPriceCents > v.priceCents);

  return (
    <div className={styles.cardContainer}>
      <Link href={`/produit/${product.slug}`} locale={locale} className={styles.card}>
        <div className={styles.imageWrap}>
          {image ? (
            <img src={image.url} alt={image.alt} className={styles.image} />
          ) : (
            <div className={styles.placeholder}>Photo</div>
          )}
        </div>
        
        {hasSale && <div className={styles.promoTag}>Offre spéciale</div>}
        
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
      
      {colors.length > 1 && (
        <div className={styles.colorSelector}>
          {colors.map((color) => {
            const hex = COLOR_MAP[color] || '#cccccc';
            const isActive = color === selectedColor;
            return (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`${styles.colorCircle} ${isActive ? styles.colorCircleActive : ''}`}
                style={{ backgroundColor: hex }}
                title={color}
                aria-label={`Select color ${color}`}
                type="button"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
