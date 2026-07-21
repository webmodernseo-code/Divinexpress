import { getTranslations } from 'next-intl/server';
import { PromoBanner } from '@/components/PromoBanner/PromoBanner';
import type { Locale } from '@/i18n';
import styles from './CategoryStrip.module.css';

export async function CategoryStrip({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');

  return (
    <section id="categories" className={styles.section}>
      <h2 className={styles.title}>{t('decouverteTitle')}</h2>
      <div className={styles.promoPair}>
        <PromoBanner
          title={t('promoHommeTitle')}
          ctaLabel={t('promoHommeCta')}
          href="/homme"
          locale={locale}
          imageSeed="divinexpress-promo-homme"
          badge={t('promoHommeBadge')}
        />
        <PromoBanner
          title={t('promoSaleTitle')}
          ctaLabel={t('promoSaleCta')}
          href="/sale"
          locale={locale}
          imageSeed="divinexpress-promo-sale"
          badge={t('promoSaleBadge')}
        />
      </div>
    </section>
  );
}

