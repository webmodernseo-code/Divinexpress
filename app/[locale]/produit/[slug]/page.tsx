import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getProductBySlug } from '@/lib/catalog';
import { cheapestVariant } from '@/lib/pricing';
import { getLocalizedField } from '@/lib/i18n-utils';
import { PriceDisplay } from '@/components/PriceDisplay/PriceDisplay';
import { Gallery } from '@/components/Gallery/Gallery';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

export default async function ProductPage({ params }: { params: { locale: string; slug: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('pdp');
  const tHeader = await getTranslations('header');

  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const name = getLocalizedField(product, 'name', locale);
  const description = getLocalizedField(product, 'description', locale);
  const cheapest = cheapestVariant(product.variants);
  const sizes = [...new Set(product.variants.map((variant) => variant.size))];
  const colors = [...new Set(product.variants.map((variant) => variant.color))];

  return (
    <div className={styles.page}>
      <div className={styles.gallery}>
        <Gallery images={product.images} />
      </div>
      <div className={styles.info}>
        <div className={styles.category}>{tHeader(product.category.slug as any)}</div>
        <h1 className={styles.name}>{name}</h1>
        <p className={styles.description}>{description}</p>
        {cheapest && (
          <PriceDisplay
            priceCents={cheapest.priceCents}
            compareAtPriceCents={cheapest.compareAtPriceCents}
            locale={locale}
            className={styles.price}
          />
        )}
        <div className={styles.variantGroup}>
          <div className={styles.variantLabel}>{t('size')}</div>
          <div className={styles.variantOptions}>
            {sizes.map((size) => (
              <span key={size} className={styles.variantOption}>
                {size}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.variantGroup}>
          <div className={styles.variantLabel}>{t('color')}</div>
          <div className={styles.variantOptions}>
            {colors.map((color) => (
              <span key={color} className={styles.variantOption}>
                {color}
              </span>
            ))}
          </div>
        </div>
        <button type="button" className={styles.addToBag}>
          {t('addToBag')}
        </button>
      </div>
    </div>
  );
}
