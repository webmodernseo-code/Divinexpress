import type { Locale } from '@/i18n';
import { ProductCard, type ProductCardData } from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

export function ProductGrid({
  title,
  products,
  locale
}: {
  title: string;
  products: ProductCardData[];
  locale: Locale;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} locale={locale} />
        ))}
      </div>
    </section>
  );
}
