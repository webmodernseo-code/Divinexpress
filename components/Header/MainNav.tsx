'use client';

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

  function isLinkActive(href: string): boolean {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className={styles.nav}>
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
  );
}
