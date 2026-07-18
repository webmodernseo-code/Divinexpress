'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './MainNav.module.css';

interface NavItem {
  key: string;
  label: string;
  href: string;
}

export function MainNav({ locale, items }: { locale: Locale; items: NavItem[] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isLinkActive(href: string): boolean {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={styles.desktopNav}>
        {items.map((item) => {
          const active = isLinkActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              locale={locale}
              className={`${styles.navLink} ${active ? styles.active : styles.inactive}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Burger Trigger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={styles.burgerButton}
        aria-label="Menu"
        aria-expanded={menuOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {menuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile Navigation Drawer */}
      <div className={`${styles.mobileDrawer} ${menuOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Menu</span>
          <button onClick={() => setMenuOpen(false)} className={styles.drawerClose} aria-label="Fermer le menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className={styles.mobileNav}>
          {items.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                locale={locale}
                onClick={() => setMenuOpen(false)}
                className={`${styles.mobileNavLink} ${active ? styles.mobileActive : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
