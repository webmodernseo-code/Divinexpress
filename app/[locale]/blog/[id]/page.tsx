import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { POSTS } from '@/components/BlogPreview/BlogPreview';
import styles from './page.module.css';

export default async function ArticlePage({
  params
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('home');
  const tHeader = await getTranslations('header');

  const postId = parseInt(params.id, 10);
  const post = POSTS.find((p) => p.id === postId);
  if (!post) notFound();

  const title = locale === 'fr' ? post.titleFr : post.titleEn;
  const category = locale === 'fr' ? post.categoryFr : post.categoryEn;
  const body = locale === 'fr' ? post.bodyFr : post.bodyEn;
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  const relatedPosts = POSTS.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <main className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/" locale={locale} className={styles.crumb}>
          {tHeader('home')}
        </Link>
        <span className={styles.sep}>/</span>
        <Link href="/blog" locale={locale} className={styles.crumb}>
          {t('blogTitle')}
        </Link>
        <span className={styles.sep}>/</span>
        <span className={styles.active}>{title}</span>
      </nav>

      {/* Article Header */}
      <header className={styles.header}>
        <span className={styles.categoryBadge}>{category}</span>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.date}>{formatter.format(new Date(post.date))}</div>
      </header>

      {/* Hero Image */}
      <div className={styles.imageContainer}>
        <img src={post.imageUrl} alt="" className={styles.heroImage} />
      </div>

      {/* Article Content */}
      <article className={styles.content}>
        {body.map((p, idx) => (
          <p key={idx} className={styles.paragraph}>
            {p}
          </p>
        ))}
      </article>

      {/* Related Posts */}
      <section className={styles.related}>
        <h2 className={styles.relatedTitle}>
          {locale === 'fr' ? 'Articles similaires' : 'Related Articles'}
        </h2>
        <div className={styles.relatedGrid}>
          {relatedPosts.map((related) => (
            <Link key={related.id} href={`/blog/${related.id}`} locale={locale} className={styles.relatedCard}>
              <div className={styles.relatedImageWrap}>
                <img src={related.imageUrl} alt="" className={styles.relatedImage} />
              </div>
              <div className={styles.relatedMeta}>
                {locale === 'fr' ? related.categoryFr : related.categoryEn} · {formatter.format(new Date(related.date))}
              </div>
              <h3 className={styles.relatedPostTitle}>
                {locale === 'fr' ? related.titleFr : related.titleEn}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
