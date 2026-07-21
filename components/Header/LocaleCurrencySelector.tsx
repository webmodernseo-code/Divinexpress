'use client';

import { useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { Dropdown } from './Dropdown';
import styles from './LocaleCurrencySelector.module.css';

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' }
];

const CURRENCIES = [
  { value: 'EUR', label: 'France (EUR €)' },
  { value: 'GBP', label: 'Royaume-Uni (GBP £)' },
  { value: 'XOF', label: 'UEMOA (XOF F CFA)' }
];

export function LocaleCurrencySelector({
  locale,
  theme = 'dark',
  className
}: {
  locale: Locale;
  theme?: 'dark' | 'light';
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currency, setCurrency] = useState('EUR');

  return (
    <div className={`${styles.selectorGroup} ${className || ''}`}>
      <Dropdown
        options={LANGUAGES}
        value={locale}
        onChange={(next) => router.replace(pathname, { locale: next as Locale })}
        ariaLabel="Language"
        theme={theme}
      />
      <Dropdown
        options={CURRENCIES}
        value={currency}
        onChange={setCurrency}
        ariaLabel="Currency"
        theme={theme}
        align="right"
      />
    </div>
  );
}
