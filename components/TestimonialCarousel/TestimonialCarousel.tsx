'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './TestimonialCarousel.module.css';

const ITEMS = [1, 2, 3, 4, 5, 6] as const;

export function TestimonialCarousel() {
  const t = useTranslations('testimonials');
  const [index, setIndex] = useState(0);

  const visible = [0, 1, 2].map((offset) => ITEMS[(index + offset) % ITEMS.length]);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('title')}</h2>
      <div className={styles.carousel}>
        <button
          type="button"
          onClick={() => setIndex((current) => (current - 1 + ITEMS.length) % ITEMS.length)}
          className={styles.arrow}
          aria-label="Previous"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className={styles.grid}>
          {visible.map((n) => (
            <div key={n} className={styles.card}>
              <p className={styles.quote}>&ldquo;{t(`quote${n}`)}&rdquo;</p>
              <p className={styles.name}>{t(`name${n}`)}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIndex((current) => (current + 1) % ITEMS.length)}
          className={styles.arrow}
          aria-label="Next"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className={styles.dots}>
        {ITEMS.map((n, i) => (
          <span
            key={n}
            onClick={() => setIndex(i)}
            className={i === index ? styles.dotActive : styles.dot}
          />
        ))}
      </div>
    </section>
  );
}
