import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CategoryTile } from '@/components/CategoryTile/CategoryTile';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

const CATEGORIES = ['homme', 'femme', 'running', 'sale'] as const;

export default async function HomePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('home');
  const tHeader = await getTranslations('header');

  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>{t('heroTitle')}</h1>
        <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
        <Link href="/homme" locale={locale} className={styles.heroCta}>
          {t('heroCta')}
        </Link>
      </section>
      <section className={styles.categories}>
        {CATEGORIES.map((slug) => (
          <CategoryTile key={slug} slug={slug} label={tHeader(slug)} locale={locale} />
        ))}
      </section>
    </>
  );
}
