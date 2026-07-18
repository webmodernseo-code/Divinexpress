import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { POSTS } from '@/components/BlogPreview/BlogPreview';
import styles from './page.module.css';

export default async function BlogPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('home');
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <span className={styles.category}>{locale === 'fr' ? 'Le Journal' : 'The Journal'}</span>
        <h1 className={styles.title}>{t('blogTitle')}</h1>
        <p className={styles.subtitle}>
          {locale === 'fr' 
            ? "Découvrez nos derniers articles, conseils de style et guides d'entretien." 
            : 'Discover our latest articles, styling tips and garment care guides.'}
        </p>
      </header>

      <div className={styles.grid}>
        {POSTS.map((post) => (
          <Link key={post.id} href={`/blog/${post.id}`} locale={locale} className={styles.card}>
            <div className={styles.imageWrap}>
              <img src={post.imageUrl} alt="" className={styles.image} />
            </div>
            <div className={styles.meta}>
              {locale === 'fr' ? post.categoryFr : post.categoryEn} · {formatter.format(new Date(post.date))}
            </div>
            <h2 className={styles.postTitle}>{locale === 'fr' ? post.titleFr : post.titleEn}</h2>
          </Link>
        ))}
      </div>
    </main>
  );
}
