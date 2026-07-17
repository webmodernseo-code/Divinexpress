import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './PromoBanner.module.css';

export function PromoBanner({
  title,
  ctaLabel,
  href,
  locale,
  imageSeed,
  badge,
  size = 'half'
}: {
  title: string;
  ctaLabel: string;
  href: string;
  locale: Locale;
  imageSeed: string;
  badge?: string;
  size?: 'half' | 'full';
}) {
  return (
    <Link href={href} locale={locale} className={size === 'full' ? styles.bannerFull : styles.bannerHalf}>
      <img src={`https://picsum.photos/seed/${imageSeed}/1200/700`} alt="" className={styles.image} />
      <div className={styles.overlay} />
      {badge && <span className={styles.badge}>{badge}</span>}
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <span className={styles.cta}>{ctaLabel} →</span>
      </div>
    </Link>
  );
}
