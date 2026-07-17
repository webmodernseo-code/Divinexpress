// components/Footer/Footer.tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCategories } from '@/lib/catalog';
import type { Locale } from '@/i18n';
import styles from './Footer.module.css';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations('footer');
  const tHeader = await getTranslations('header');
  const categories = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.heading}>{t('navHeading')}</div>
          <Link href="/" locale={locale} className={styles.link}>
            {t('navHome')}
          </Link>
          <a href="#" className={styles.link}>
            {t('navShop')}
          </a>
          <a href="#" className={styles.link}>
            {t('navAbout')}
          </a>
          <a href="#" className={styles.link}>
            {t('navContact')}
          </a>
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>{t('categoriesHeading')}</div>
          {categories.map((category) => (
            <Link key={category.slug} href={`/${category.slug}`} locale={locale} className={styles.link}>
              {tHeader(category.slug as 'homme' | 'femme' | 'running')}
            </Link>
          ))}
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>{t('utilityHeading')}</div>
          <a href="#" className={styles.link}>
            {t('utilitySizeGuide')}
          </a>
          <a href="#" className={styles.link}>
            {t('utilityLegal')}
          </a>
          <a href="#" className={styles.link}>
            {t('utilityTerms')}
          </a>
          <a href="#" className={styles.link}>
            {t('utilityPrivacy')}
          </a>
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>{t('contactHeading')}</div>
          <a href="mailto:contact@divinexpress.fr" className={styles.link}>
            contact@divinexpress.fr
          </a>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className={styles.payments}>
          <span className={styles.paymentBadge}>Visa</span>
          <span className={styles.paymentBadge}>Mastercard</span>
          <span className={styles.paymentBadge}>PayPal</span>
        </div>
        <p className={styles.copyright}>{t('copyright', { year })}</p>
      </div>
    </footer>
  );
}
