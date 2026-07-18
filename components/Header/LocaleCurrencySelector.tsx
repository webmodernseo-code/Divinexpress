'use client';

import { useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n';
import styles from './LocaleCurrencySelector.module.css';

const CURRENCIES = [
  { value: 'EUR', label: 'France (EUR €)' },
  { value: 'GBP', label: 'Royaume-Uni (GBP £)' },
  { value: 'XOF', label: 'UEMOA (XOF F CFA)' }
] as const;

export function LocaleCurrencySelector({ locale, theme = 'dark' }: { locale: Locale; theme?: 'dark' | 'light' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currency, setCurrency] = useState('EUR');

  const selectClass = `${styles.select} ${theme === 'light' ? styles.selectLight : styles.selectDark}`;

  return (
    <div className={styles.selectorGroup}>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
        className={selectClass}
        aria-label="Language"
      >
        <option value="fr" className={styles.option}>Français</option>
        <option value="en" className={styles.option}>English</option>
      </select>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className={selectClass}
        aria-label="Currency"
      >
        {CURRENCIES.map((c) => (
          <option key={c.value} value={c.value} className={styles.option}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
