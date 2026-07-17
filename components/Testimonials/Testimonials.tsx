import { getTranslations } from 'next-intl/server';
import styles from './Testimonials.module.css';

const ITEMS = [1, 2, 3] as const;

export async function Testimonials() {
  const t = await getTranslations('testimonials');

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('title')}</h2>
      <div className={styles.grid}>
        {ITEMS.map((n) => (
          <div key={n} className={styles.card}>
            <p className={styles.quote}>&ldquo;{t(`quote${n}`)}&rdquo;</p>
            <p className={styles.name}>{t(`name${n}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
