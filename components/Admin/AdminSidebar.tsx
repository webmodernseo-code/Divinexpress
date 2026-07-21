'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './AdminSidebar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: JSX.Element;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const icon = (path: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Boutique',
    items: [
      { label: 'Vue d\'ensemble', href: '/admin', icon: icon('M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z') },
      { label: 'Commandes', href: '/admin/commandes', icon: icon('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0') },
      { label: 'Retours', href: '/admin/retours', icon: icon('M3 7v6h6M3 13a9 9 0 1 0 3-6.7L3 9') },
      { label: 'Clients', href: '/admin/clients', icon: icon('M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z') }
    ]
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Produits', href: '/admin/produits', icon: icon('M21 8 12 3 3 8l9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8') },
      { label: 'Réductions', href: '/admin/reductions', icon: icon('M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0l-7.4-7.4a2 2 0 0 1 0-2.8L10.4 2.4a2 2 0 0 1 1.4-.4H19a2 2 0 0 1 2 2v6.8a2 2 0 0 1-.4 1.4zM15 8h.01') },
      { label: 'Articles de blog', href: '/admin/blog', icon: icon('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6') }
    ]
  },
  {
    label: 'Suivi',
    items: [
      { label: 'Analytique', href: '/admin/analytique', icon: icon('M3 3v18h18M8 17V10M13 17V6M18 17v-4') },
      { label: 'Messages', href: '/admin/messages', icon: icon('M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z') }
    ]
  }
];

const SETTINGS_ITEM: NavItem = {
  label: 'Paramètres',
  href: '/admin/parametres',
  icon: icon('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z')
};

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  }

  function renderItem(item: NavItem) {
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <svg width="32" height="32" viewBox="0 0 100 100">
          <polygon points="50,3 95,26 95,74 50,97 5,74 5,26" fill="#0c0407" />
          <text x="50" y="62" fontSize="36" fontWeight="800" fill="#ffffff" textAnchor="middle" fontFamily="Inter, sans-serif">
            DX
          </text>
        </svg>
        <span className={styles.brandText}>DIVINEXPRESS</span>
      </div>

      <nav className={styles.nav}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={styles.navGroup}>
            <span className={styles.navGroupLabel}>{group.label}</span>
            {group.items.map(renderItem)}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        {renderItem(SETTINGS_ITEM)}
        <form action="/admin/logout" method="POST">
          <button type="submit" className={styles.logout}>
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
