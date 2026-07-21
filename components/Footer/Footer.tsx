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
        {/* Brand & Logo */}
        <div className={styles.brandCol}>
          <Link href="/" locale={locale} className={styles.brandLogo}>
            <svg width="44" height="44" viewBox="0 0 100 100" className={styles.logoSvg}>
              <polygon points="50,3 95,26 95,74 50,97 5,74 5,26" fill="none" stroke="#fff" strokeWidth="6" />
              <text x="50" y="62" fontSize="28" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="Inter, sans-serif">
                DX
              </text>
            </svg>
            <span className={styles.brandTitle}>DIVINEXPRESS</span>
          </Link>
          <p className={styles.brandTagline}>
            Mode & vêtements premium livrés en France et en Afrique de l'Ouest.
          </p>
          <div className={styles.socials}>
            <a href="#" className={styles.socialIcon} aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#" className={styles.socialIcon} aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" className={styles.socialIcon} aria-label="TikTok">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>
        </div>

        {/* Navigation */}
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

        {/* Contact */}
        <div className={styles.column}>
          <h4 className={styles.heading}>{t('contactHeading')}</h4>
          <div className={styles.contactDetails}>
            <span className={styles.contactCompany}>BOUTIQUE DIVINEXPRESS</span>
            <span className={styles.contactText}>349 Avenue Jean Jaurès - 69007 Lyon</span>
            <a href="mailto:contact@divinexpress.com" className={styles.contactMail}>
              contact@divinexpress.com
            </a>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.bottom}>
        {/* Payment Logos SVG */}
        <div className={styles.paymentRow}>
          <span className={styles.paymentLabel}>Moyens de paiement sécurisés</span>
          <div className={styles.paymentLogos}>
            <div className={styles.paymentCard} title="Visa">
              <svg width="42" height="26" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#1A1F71"/>
                <text x="19" y="16" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="Inter, sans-serif" fontStyle="italic">VISA</text>
              </svg>
            </div>
            <div className={styles.paymentCard} title="Mastercard">
              <svg width="42" height="26" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#222222"/>
                <circle cx="14" cy="12" r="7" fill="#EB001B"/>
                <circle cx="24" cy="12" r="7" fill="#F79E1B" fillOpacity="0.85"/>
              </svg>
            </div>
            <div className={styles.paymentCard} title="Apple Pay">
              <svg width="42" height="26" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#000000" stroke="#444" strokeWidth="1"/>
                <text x="19" y="15" fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="Inter, sans-serif"> Pay</text>
              </svg>
            </div>
            <div className={styles.paymentCard} title="PayPal">
              <svg width="42" height="26" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#003087"/>
                <text x="19" y="16" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="Inter, sans-serif">PayPal</text>
              </svg>
            </div>
            <div className={styles.paymentCard} title="Mobile Money">
              <svg width="42" height="26" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#FFCC00"/>
                <text x="19" y="15" fill="#000" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="Inter, sans-serif">MoMo</text>
              </svg>
            </div>
            <div className={styles.paymentCard} title="Wave">
              <svg width="42" height="26" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#1DC3E7"/>
                <text x="19" y="15" fill="#fff" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="Inter, sans-serif">Wave</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Policy Links & Copyright */}
        <div className={styles.subBottom}>
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
          <p className={styles.copyright}>© {year}, DivinExpress. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

