import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { MessageCarousel } from './MessageCarousel';
import styles from './Header.module.css';

const NAV_CATEGORIES = ['homme', 'femme', 'running', 'sale'] as const;

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');

  return (
    <header>
      <div className={styles.topbar}>
        <MessageCarousel messages={[t('topbarMsg1'), t('topbarMsg2')]} />
      </div>
      <div className={styles.mainBar}>
        <Link href="/" locale={locale} className={styles.brand}>
          <span className={styles.logo}>DX</span>
          <span>{t('brand')}</span>
        </Link>
        <nav className={styles.nav} aria-label={t('navLabel')}>
          {NAV_CATEGORIES.map((slug) => (
            <Link key={slug} href={`/${slug}`} locale={locale} className={styles.navLink}>
              {t(slug)}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <Link href="/recherche" locale={locale} className={styles.iconLink} aria-label={t('searchLabel')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <span className={styles.iconLink} aria-label={t('cart')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className={styles.badge}>0</span>
          </span>
          <span className={styles.iconLink} aria-label={t('accountLabel')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </span>
        </div>
      </div>
    </header>
  );
}
