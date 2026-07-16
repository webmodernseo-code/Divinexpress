import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { LocaleToggle } from './LocaleToggle';
import { SearchForm } from './SearchForm';
import { MessageCarousel } from './MessageCarousel';
import styles from './Header.module.css';

const NAV_CATEGORIES = ['homme', 'femme', 'running', 'sale'] as const;

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');

  return (
    <header>
      <div className={styles.topBar}>
        <div className={styles.social} aria-label="Social media links">
          <a href="#" className={styles.socialIcon} aria-label="Facebook">f</a>
          <a href="#" className={styles.socialIcon} aria-label="Instagram">ig</a>
          <a href="#" className={styles.socialIcon} aria-label="YouTube">yt</a>
          <a href="#" className={styles.socialIcon} aria-label="TikTok">tk</a>
        </div>
        
        <MessageCarousel />
        
        <div className={styles.selectors}>
          <div className={styles.selectorItem}>
            <span>🌐</span>
            <span>{t('langSelect')}</span>
            <span className={styles.chevron}>▾</span>
            <Suspense fallback={null}>
              <div className={styles.hiddenToggle}>
                <LocaleToggle current={locale} />
              </div>
            </Suspense>
          </div>
          <div className={styles.selectorItem}>
            <span>📍</span>
            <span>{t('countrySelect')}</span>
            <span className={styles.chevron}>▾</span>
          </div>
        </div>
      </div>
      <div className={styles.mainBar}>
        <Link href="/" locale={locale} className={styles.brandLink}>
          <span className={styles.logo}>DX</span>
          <span className={styles.brand}>{t('brand')}</span>
        </Link>
        <nav className={styles.nav} aria-label={t('navLabel')}>
          {NAV_CATEGORIES.map((slug) => (
            <Link
              key={slug}
              href={`/${slug}`}
              locale={locale}
              className={slug === 'sale' ? styles.navSale : styles.navLink}
            >
              {t(slug)}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <SearchForm placeholder={t('searchPlaceholder')} />
          <span className={styles.cart}>{t('cart')} (0)</span>
        </div>
      </div>
    </header>
  );
}
