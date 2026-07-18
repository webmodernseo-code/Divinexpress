import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCategories } from '@/lib/catalog';
import type { Locale } from '@/i18n';
import styles from './CategoryStrip.module.css';

export async function CategoryStrip({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');
  const tHome = await getTranslations('home');
  const categories = await getCategories();

  return (
    <section id="categories" className={styles.section}>
      <h2 className={styles.title}>{tHome('categoriesTitle')}</h2>
      <div className={styles.strip}>
        {categories.map((category) => (
          <Link key={category.slug} href={`/${category.slug}`} locale={locale} className={styles.tile}>
            <img
              src={`https://picsum.photos/seed/divinexpress-${category.slug}/400/400`}
              alt=""
              className={styles.image}
            />
            <span className={styles.label}>{t(category.slug as 'homme' | 'femme' | 'enfant')}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
