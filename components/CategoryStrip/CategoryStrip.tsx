import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCategories } from '@/lib/catalog';
import type { Locale } from '@/i18n';
import styles from './CategoryStrip.module.css';

const CATEGORY_IMAGES: Record<string, string> = {
  homme: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
  femme: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80',
  enfant: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&auto=format&fit=crop&q=80'
};

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
              src={CATEGORY_IMAGES[category.slug] || CATEGORY_IMAGES.homme}
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
