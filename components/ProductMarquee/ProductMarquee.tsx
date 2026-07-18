import type { Locale } from '@/i18n';
import { ProductCard, type ProductCardData } from '../ProductCard/ProductCard';
import styles from './ProductMarquee.module.css';

export function ProductMarquee({
  title,
  products,
  locale
}: {
  title: string;
  products: ProductCardData[];
  locale: Locale;
}) {
  const looped = [...products, ...products];

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {looped.map((product, index) => (
            <div key={`${product.slug}-${index}`} className={styles.item}>
              <ProductCard product={product} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
