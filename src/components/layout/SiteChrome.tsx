'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { ChatbotBubble } from './ChatbotBubble';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { StoreSettingsProvider } from '@/context/StoreSettingsContext';
import { DEFAULT_STORE_SETTINGS, type PublicStoreSettings } from '@/server/settings/store-settings';

const adminSegments = ['/connexion', '/dashboard', '/produits', '/commandes', '/retours', '/messages', '/clients', '/parametres'];

export function SiteChrome({ children, settings = DEFAULT_STORE_SETTINGS }: { children: ReactNode; settings?: PublicStoreSettings }) {
  const pathname = usePathname();
  const isAdmin = adminSegments.some((segment) => pathname.includes(segment));
  if (isAdmin) return <StoreSettingsProvider settings={settings}>{children}</StoreSettingsProvider>;
  return (
    <StoreSettingsProvider settings={settings}><div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <CookieBanner />
      <CartDrawer />
      <ChatbotBubble />
    </div></StoreSettingsProvider>
  );
}
