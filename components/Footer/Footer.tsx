// components/Footer/Footer.tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './Footer.module.css';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations('footer');
  const tHeader = await getTranslations('header');
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        {/* Logo DX */}
        <div className={styles.logoCol}>
          <svg width="90" height="90" viewBox="0 0 100 100" className={styles.logo}>
            <polygon points="50,3 95,26 95,74 50,97 5,74 5,26" fill="none" stroke="#fff" strokeWidth="4" />
            <text x="50" y="60" fontSize="26" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="Inter, sans-serif">
              DX
            </text>
          </svg>
        </div>

        {/* Liens Rapides */}
        <div className={styles.column}>
          <h4 className={styles.heading}>{t('navHeading')}</h4>
          <div className={styles.linksGroup}>
            <Link href="/" locale={locale} className={styles.link}>
              {tHeader('home')}
            </Link>
            <Link href="/boutique" locale={locale} className={styles.link}>
              {tHeader('shop')}
            </Link>
            <Link href="/blog" locale={locale} className={styles.link}>
              {tHeader('blog')}
            </Link>
            <Link href="/contact" locale={locale} className={styles.link}>
              {tHeader('contact')}
            </Link>
          </div>
        </div>

        {/* Contact info */}
        <div className={styles.column}>
          <h4 className={styles.heading}>{t('contactHeading').toUpperCase()}</h4>
          <div className={styles.contactDetails}>
            <span className={styles.contactCompany}>BOUTIQUE DIVINEXPRESS</span>
            <span className={styles.contactText}>349 Avenue Jean Jaurès - 69007</span>
            <span className={styles.contactText}>Lyon</span>
            <a href="mailto:contact@divinexpress.com" className={styles.contactMail}>
              contact@divinexpress.com
            </a>
          </div>
        </div>

        {/* Socials */}
        <div className={styles.socialsColumn}>
          <a href="#" className={styles.socialIcon} aria-label="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a href="#" className={styles.socialIcon} aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5h.01" />
            </svg>
          </a>
          <a href="#" className={styles.socialIcon} aria-label="TikTok">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
          </a>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.bottom}>
        {/* Payment Badges */}
        <div className={styles.payments}>
          <span className={styles.paymentBadge}>Visa</span>
          <span className={styles.paymentBadge}>Mastercard</span>
          <span className={styles.paymentBadge}>PayPal</span>
          <span className={styles.paymentBadge}>Mobile Money</span>
          <span className={styles.paymentBadge}>CB</span>
        </div>

        {/* Legal/Policy Links */}
        <div className={styles.policyLinks}>
          <Link href="/politique/privacy" locale={locale} className={styles.policyLink}>
            {t('utilityPrivacy')}
          </Link>
          <Link href="/politique/refund" locale={locale} className={styles.policyLink}>
            {t('utilityRefund')}
          </Link>
          <Link href="/politique/terms" locale={locale} className={styles.policyLink}>
            {t('utilityTermsOfUse')}
          </Link>
          <Link href="/politique/shipping" locale={locale} className={styles.policyLink}>
            {t('utilityShipping')}
          </Link>
          <Link href="/politique/cgv" locale={locale} className={styles.policyLink}>
            {t('utilityCgv')}
          </Link>
          <Link href="/politique/legal" locale={locale} className={styles.policyLink}>
            {t('utilityLegal')}
          </Link>
        </div>

        {/* Copyright */}
        <p className={styles.copyright}>© {year}, DivinExpress</p>
      </div>
    </footer>
  );
}
