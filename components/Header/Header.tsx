import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { LocaleToggle } from './LocaleToggle';
import { SearchForm } from './SearchForm';
import styles from './Header.module.css';

const NAV_CATEGORIES = ['homme', 'femme', 'running', 'sale'] as const;

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');

  return (
    <div>
      <div className={styles.topBar}>
        <div className={styles.social} aria-hidden="true">
          <span className={styles.socialIcon}>f</span>
          <span className={styles.socialIcon}>ig</span>
          <span className={styles.socialIcon}>tt</span>
        </div>
        <LocaleToggle current={locale} />
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
    </div>
  );
}
