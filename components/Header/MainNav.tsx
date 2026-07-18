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
          <div className={styles.drawerSelectorLabel}>Langue & Devise</div>
          <LocaleCurrencySelector locale={locale} theme="light" />

          <div className={styles.drawerSocialsLabel}>Suivez-nous</div>
          <div className={styles.drawerSocials}>
            {/* Facebook */}
            <a href="#" className={styles.drawerSocialLink} aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
