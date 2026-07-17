import { getTranslations } from 'next-intl/server';
import styles from './TrustBar.module.css';

const ITEMS = ['payment', 'delivery', 'returns', 'materials'] as const;

const ICON_PATHS: Record<(typeof ITEMS)[number], string> = {
  payment: 'M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
  delivery:
    'M3 7h11v8H3zM14 10h4l3 3v2h-7zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  returns: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5',
  materials: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
};

export async function TrustBar() {
  const t = await getTranslations('trustbar');

  return (
    <section className={styles.bar}>
      {ITEMS.map((item) => (
        <div key={item} className={styles.item}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d={ICON_PATHS[item]} />
          </svg>
          <div className={styles.title}>{t(`${item}Title`)}</div>
          <div className={styles.desc}>{t(`${item}Desc`)}</div>
        </div>
      ))}
    </section>
  );
}
