'use client';

import { useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n';
import styles from './HeaderActions.module.css';

const CURRENCIES = ['EUR', 'GBP', 'XOF'] as const;

export function HeaderActions({
  locale,
  cartLabel,
  searchLabel,
  accountLabel
}: {
  locale: Locale;
  cartLabel: string;
  searchLabel: string;
  accountLabel: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>('EUR');
  const pathname = usePathname();
  const router = useRouter();

  function submitSearch() {
    if (query.trim() === '') return;
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className={styles.actions}>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
        className={styles.select}
        aria-label="Language"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </select>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as (typeof CURRENCIES)[number])}
        className={styles.select}
        aria-label="Currency"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {searchOpen && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder={searchLabel}
          autoFocus
          className={styles.searchInput}
        />
      )}
      <button
        type="button"
        onClick={() => setSearchOpen((open) => !open)}
        className={styles.iconLink}
        aria-label={searchLabel}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      <span className={styles.iconLink} aria-label={cartLabel}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span className={styles.badge}>0</span>
      </span>
      <span className={styles.iconLink} aria-label={accountLabel}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      </span>
    </div>
  );
}
