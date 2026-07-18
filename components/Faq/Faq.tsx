'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './Faq.module.css';

const ITEMS = [1, 2, 3, 4, 5] as const;

export function Faq() {
  const t = useTranslations('faq');
  const [openKey, setOpenKey] = useState<number | null>(null);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('title')}</h2>
      <div className={styles.list}>
        {ITEMS.map((n) => {
          const isOpen = openKey === n;
          return (
            <div key={n} className={styles.item}>
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : n)}
                className={styles.question}
              >
                <span className={styles.questionText}>{t(`q${n}`)}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isOpen ? styles.chevronOpen : styles.chevron}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isOpen && <p className={styles.answer}>{t(`a${n}`)}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
