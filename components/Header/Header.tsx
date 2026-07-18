import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { MessageCarousel } from './MessageCarousel';
import { HeaderActions } from './HeaderActions';
import { LocaleCurrencySelector } from './LocaleCurrencySelector';
import { MainNav } from './MainNav';
import styles from './Header.module.css';

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('header');

  const navItems = [
    { key: 'home', label: t('home'), href: '/' },
    { key: 'shop', label: t('shop'), href: '/boutique' },
    { key: 'blog', label: t('blog'), href: '/blog' },
    { key: 'contact', label: t('contact'), href: '/contact' }
  ];

  return (
    <header className={styles.header}>
      {/* Top Bar */}
      <div className={styles.topbar}>
        {/* Social Networks Links */}
        <div className={styles.socials}>
          {/* Facebook */}
          <a href="#" className={styles.socialLink} aria-label="Facebook">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          {/* Instagram */}
          <a href="#" className={styles.socialLink} aria-label="Instagram">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5h.01" />
            </svg>
          </a>
          {/* TikTok */}
          <a href="#" className={styles.socialLink} aria-label="TikTok">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
          </a>
        </div>

        {/* Centered Messages Carousel */}
        <div className={styles.carouselContainer}>
          <MessageCarousel messages={[t('topbarMsg1'), t('topbarMsg2'), t('topbarMsg3')]} />
        </div>

        {/* Locale and Currency selectors */}
        <div className={styles.selectors}>
          <LocaleCurrencySelector locale={locale} />
        </div>
      </div>

      {/* Main Bar */}
      <div className={styles.mainBar}>
        <Link href="/" locale={locale} className={styles.brand}>
          {/* Polygon Diamond logo */}
          <svg className={styles.logoSvg} width="44" height="44" viewBox="0 0 100 100">
            <polygon points="50,3 95,26 95,74 50,97 5,74 5,26" fill="var(--color-black)" />
            <text x="50" y="65" fontSize="40" fontWeight="800" fill="var(--color-white)" textAnchor="middle" fontFamily="var(--font-sans)">
              DX
            </text>
          </svg>
          <span className={styles.brandText}>{t('brand')}</span>
        </Link>

        {/* Main Pill navigation */}
        <MainNav locale={locale} items={navItems} />

        {/* Right side actions (search, bag) */}
        <HeaderActions locale={locale} searchLabel={t('searchLabel')} />
      </div>
    </header>
  );
}
