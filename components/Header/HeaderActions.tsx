'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './HeaderActions.module.css';

export function HeaderActions({
  locale,
  searchLabel
}: {
  locale: Locale;
  searchLabel: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  function submitSearch() {
    if (query.trim() === '') return;
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className={styles.actions}>
      <div className={styles.searchWrapper}>
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
        <svg
          onClick={() => setSearchOpen((open) => !open)}
          className={styles.icon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-black)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ cursor: 'pointer', flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      <div className={styles.cartWrapper}>
        <svg
          className={styles.icon}
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-black)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ cursor: 'pointer' }}
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span className={styles.badge}>0</span>
      </div>
    </div>
  );
}
