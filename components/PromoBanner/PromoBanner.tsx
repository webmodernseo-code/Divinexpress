import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './PromoBanner.module.css';

const IMAGE_MAP: Record<string, string> = {
  'divinexpress-promo-homme': 'https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/68b5f21c578e1569fb31492f_explore-img.png',
  'divinexpress-promo-sale': 'https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/689f6dcb3e0d08d8984287ad_Explore-Right-Frame.png',
  'divinexpress-weekend': 'https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/689f6c65381608ffd59aca70_Offer-Frame-one.png'
};

export function PromoBanner({
  title,
  ctaLabel,
  href,
  locale,
  imageSeed,
  badge,
  size = 'half',
  description
}: {
  title: string;
  ctaLabel: string;
  href: string;
  locale: Locale;
  imageSeed: string;
  badge?: string;
  size?: 'half' | 'full';
  description?: string;
}) {
  const imageUrl = IMAGE_MAP[imageSeed] || `https://picsum.photos/seed/${imageSeed}/1200/700`;

  return (
    <Link href={href} locale={locale} className={size === 'full' ? styles.bannerFull : styles.bannerHalf}>
      <img src={imageUrl} alt="" className={styles.image} />
      <div className={styles.overlay} />
      {badge && <span className={styles.badge}>{badge}</span>}
      <div className={styles.content}>
        {size === 'full' ? (
          <div className={styles.fullLayout}>
            <h3 className={styles.titleFull}>{title}</h3>
            {description && <p className={styles.descFull}>{description}</p>}
          </div>
        ) : (
          <div className={styles.halfLayout}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.pulseContainer}>
              <span className={styles.ctaButton}>{ctaLabel}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
