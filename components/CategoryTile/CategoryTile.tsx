import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './CategoryTile.module.css';

export function CategoryTile({ slug, label, locale }: { slug: string; label: string; locale: Locale }) {
  return (
    <Link href={`/${slug}`} locale={locale} className={styles.tile}>
      <div className={styles.placeholder}>Photo</div>
      <div className={styles.label}>{label}</div>
    </Link>
  );
}
