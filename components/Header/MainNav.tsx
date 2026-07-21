'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import { LocaleCurrencySelector } from './LocaleCurrencySelector';
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

        {/* Footer Area inside Mobile Drawer containing language/currency selector and socials */}
        <div className={styles.drawerFooter}>
          <div className={styles.drawerSelectorLabel}>
            {locale === 'fr' ? 'Langue & Devise' : 'Language & Currency'}
          </div>
          <LocaleCurrencySelector locale={locale} theme="light" className={styles.drawerSelectors} />

          <div className={styles.drawerSocialsLabel}>
            {locale === 'fr' ? 'Suivez-nous' : 'Follow us'}
          </div>
          <div className={styles.drawerSocials}>
            {/* Facebook */}
            <a href="#" className={styles.drawerSocialLink} aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" className={styles.drawerSocialLink} aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5h.01" />
              </svg>
            </a>
            {/* TikTok */}
            <a href="#" className={styles.drawerSocialLink} aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
