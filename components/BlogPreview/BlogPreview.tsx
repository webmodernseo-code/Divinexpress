import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import styles from './BlogPreview.module.css';

const POSTS: {
  seed: string;
  titleFr: string;
  titleEn: string;
  categoryFr: string;
  categoryEn: string;
  date: string;
}[] = [
  {
    seed: 'divinexpress-blog-1',
    titleFr: 'Comment associer les couleurs cette saison',
    titleEn: 'How to pair colors this season',
    categoryFr: 'Style',
    categoryEn: 'Style',
    date: '2026-06-12'
  },
  {
    seed: 'divinexpress-blog-2',
    titleFr: 'Entretenir ses vêtements en wax',
    titleEn: 'Caring for your wax garments',
    categoryFr: 'Guide',
    categoryEn: 'Guide',
    date: '2026-06-20'
  },
  {
    seed: 'divinexpress-blog-3',
    titleFr: 'Les indispensables de la garde-robe',
    titleEn: 'Wardrobe essentials',
    categoryFr: 'Style',
    categoryEn: 'Style',
    date: '2026-07-02'
  }
];

export async function BlogPreview({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('blogTitle')}</h2>
      <div className={styles.grid}>
        {POSTS.map((post) => (
          <article key={post.seed} className={styles.card}>
            <img src={`https://picsum.photos/seed/${post.seed}/600/400`} alt="" className={styles.image} />
            <div className={styles.meta}>
              {locale === 'fr' ? post.categoryFr : post.categoryEn} · {formatter.format(new Date(post.date))}
            </div>
            <h3 className={styles.postTitle}>{locale === 'fr' ? post.titleFr : post.titleEn}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
