'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AdminTopbar.module.css';

export function AdminTopbar({ name, email }: { name: string | null; email: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = name ?? email;
  const initials = (name ? name.slice(0, 2) : email.split('@')[0].slice(0, 2)).toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  return (
    <header className={styles.topbar}>
      <div className={styles.search}>
        <svg
          className={styles.searchIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input type="text" placeholder="Rechercher..." className={styles.searchInput} readOnly />
        <span className={styles.searchKbd}>⌘K</span>
      </div>

      <div className={styles.right}>
        <span className={styles.statusPill}>
          <span className={styles.statusDot} />
          Boutique en ligne
        </span>

        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <div className={styles.profileWrapper} ref={menuRef}>
          <button
            type="button"
            className={styles.profileButton}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            <span className={styles.avatar}>{initials}</span>
            <span className={styles.profileName}>{displayName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {menuOpen && (
            <div className={styles.profileMenu}>
              <form action="/admin/logout" method="POST">
                <button type="submit" className={styles.logoutItem}>
                  Déconnexion
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
