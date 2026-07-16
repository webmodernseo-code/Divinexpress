import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './Footer.module.css';

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.logoCol}>
          <div className={styles.logo}>DX</div>
        </div>
        
        <div>
          <h3 className={styles.colTitle}>Liens rapides</h3>
          <ul className={styles.linkList}>
            <li><Link href="/" locale={locale} className={styles.link}>Accueil</Link></li>
            <li><Link href="/homme" locale={locale} className={styles.link}>Nos produits</Link></li>
            <li><Link href="#" locale={locale} className={styles.link}>Contact</Link></li>
            <li><Link href="#" locale={locale} className={styles.link}>Recherche</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className={styles.colTitle}>Contact</h3>
          <div className={styles.contactText}>
            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>BOUTIQUE DIVINEXPRESS</p>
            <p style={{ margin: '0 0 8px 0' }}>349 Avenue Jean Jaurès - 69007 Lyon</p>
            <p style={{ margin: '0' }}>support-dx@m-com.com</p>
          </div>
        </div>
        
        <div>
          <h3 className={styles.colTitle}>Réseaux sociaux</h3>
          <div className={styles.social}>
            <a href="#" className={styles.socialIcon}>f</a>
            <a href="#" className={styles.socialIcon}>ig</a>
            <a href="#" className={styles.socialIcon}>yt</a>
            <a href="#" className={styles.socialIcon}>tk</a>
          </div>
        </div>
      </div>
      
      <div className={styles.bottomBar}>
        <div className={styles.payments}>
          {/* Card Logos simulated with clean text Badges */}
          <span style={{ background: '#0070ba', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>Paypal</span>
          <span style={{ background: '#000', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}> Pay</span>
          <span style={{ background: '#1a1f3c', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>Visa</span>
          <span style={{ background: '#eb001b', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>Mastercard</span>
        </div>
        
        <div className={styles.legalLinks}>
          <a href="#" className={styles.legalLink}>Politique de confidentialité</a>
          <span>·</span>
          <a href="#" className={styles.legalLink}>{"Conditions d'utilisation"}</a>
          <span>·</span>
          <a href="#" className={styles.legalLink}>Mentions légales</a>
        </div>
        
        <div className={styles.copyright}>
          © {new Date().getFullYear()}, DivinExpress — Création Web Premium
        </div>
      </div>
    </footer>
  );
}
