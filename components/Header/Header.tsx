import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { MessageCarousel } from './MessageCarousel';
import { HeaderActions } from './HeaderActions';
import styles from './Header.module.css';

const NAV_CATEGORIES = ['homme', 'femme', 'enfant', 'sale'] as const;

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');

  return (
    <header>
      <div className={styles.topbar}>
        <MessageCarousel messages={[t('topbarMsg1'), t('topbarMsg2'), t('topbarMsg3')]} />
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
        <HeaderActions locale={locale} cartLabel={t('cart')} searchLabel={t('searchLabel')} accountLabel={t('accountLabel')} />
      </div>
    </header>
  );
}
