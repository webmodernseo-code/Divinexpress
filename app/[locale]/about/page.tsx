import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

export default async function AboutPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const tHeader = await getTranslations('header');
  const tTrust = await getTranslations('trustbar');

  return (
    <main className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/" locale={locale} className={styles.crumb}>
          {tHeader('home')}
        </Link>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbActive}>
          {locale === 'fr' ? 'À propos de nous' : 'About us'}
        </span>
      </nav>

      {/* Main Intro */}
      <section className={styles.introSection}>
        <h1 className={styles.title}>
          {locale === 'fr' ? 'À propos de nous' : 'About us'}
        </h1>
        <div className={styles.heroImageWrap}>
          <img 
            src="https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/6891dcf26e965d2e8a4c0fef_hero-image.jpg" 
            alt="DivinExpress Team & Workshop" 
            className={styles.heroImage} 
          />
        </div>
        <h2 className={styles.subtitle}>
          {locale === 'fr' ? 'Notre approche' : 'Our approach'}
        </h2>
        <p className={styles.introText}>
          {locale === 'fr'
            ? "Découvrez l'alliance parfaite du style, du confort et de la durabilité avec notre collection — pensée pour un usage quotidien, conçue pour marquer les esprits. Que vous arpentiez les rues de la ville, alliez au bureau ou retrouviez des amis, ces chaussures vous accompagnent à chaque pas."
            : "Discover the perfect blend of style, comfort, and sustainability with our collection — designed for daily wear, crafted to make an impression. Whether you walk the city streets, head to the office, or meet friends, these shoes accompany you at every step."}
        </p>
      </section>

      {/* Why Choose Us */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionHeading}>
          {locale === 'fr' ? 'Pourquoi nous choisir ?' : 'Why choose us?'}
        </h2>
        <div className={styles.featuresGrid}>
          {/* Feature 1 */}
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>{tTrust('paymentTitle')}</h3>
            <p className={styles.featureDesc}>{tTrust('paymentDesc')}</p>
          </div>
          {/* Feature 2 */}
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>{tTrust('materialsTitle')}</h3>
            <p className={styles.featureDesc}>{tTrust('materialsDesc')}</p>
          </div>
          {/* Feature 3 */}
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>{tTrust('returnsTitle')}</h3>
            <p className={styles.featureDesc}>{tTrust('returnsDesc')}</p>
          </div>
          {/* Feature 4 */}
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>{tTrust('deliveryTitle')}</h3>
            <p className={styles.featureDesc}>{tTrust('deliveryDesc')}</p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.splitSection}>
        <div className={styles.splitImageWrap}>
          <img 
            src="https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/68b5f21c578e1569fb31492f_explore-img.png" 
            alt="DivinExpress Shoes Explore" 
            className={styles.splitImage} 
          />
        </div>
        <div className={styles.splitTextWrap}>
          <h2 className={styles.splitHeading}>
            {locale === 'fr' ? 'Notre mission' : 'Our mission'}
          </h2>
          <p className={styles.splitText}>
            {locale === 'fr'
              ? 'Offrir des chaussures qui allient élégance intemporelle et confort au quotidien, fabriquées dans le respect de la planète et de celles et ceux qui les portent. Chaque paire DivinExpress est pensée pour durer, saison après saison.'
              : 'To offer shoes that combine timeless elegance and daily comfort, made with respect for the planet and those who wear them. Every pair of DivinExpress is designed to last, season after season.'}
          </p>
        </div>
      </section>

      {/* Vision */}
      <section className={styles.splitSectionReverse}>
        <div className={styles.splitTextWrap}>
          <h2 className={styles.splitHeading}>
            {locale === 'fr' ? 'Notre vision' : 'Our vision'}
          </h2>
          <p className={styles.splitText}>
            {locale === 'fr'
              ? 'Devenir la référence française de la chaussure responsable, en combinant design contemporain, matières durables et service client irréprochable — pour que chaque client se sente accompagné, du premier clic à la livraison.'
              : 'To become the French benchmark for responsible footwear, combining contemporary design, sustainable materials, and flawless customer service — so that every customer feels supported from the first click to delivery.'}
          </p>
        </div>
        <div className={styles.splitImageWrap}>
          <img 
            src="https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/689f6c65aacca81a46e142c0_Offer-Frame-two.png" 
            alt="DivinExpress Style Vision" 
            className={styles.splitImage} 
          />
        </div>
      </section>
    </main>
  );
}
