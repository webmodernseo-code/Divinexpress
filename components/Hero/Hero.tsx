import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './Hero.module.css';

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');

  return (
    <section className={styles.hero}>
      <img src="https://picsum.photos/seed/divinexpress-hero/1600/900" alt="" className={styles.image} />
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h1 className={styles.title}>{t('heroTitle')}</h1>
        <p className={styles.subtitle}>{t('heroSubtitle')}</p>
        <div className={styles.actions}>
          <div className={styles.pulse}>
            <Link href="/homme" locale={locale} className={styles.ctaPrimary}>
              {t('heroCtaShop')} →
            </Link>
          </div>
          <a href="#categories" className={styles.ctaSecondary}>
            {t('heroCtaCategories')} →
          </a>
        </div>
      </div>
    </section>
  );
}
