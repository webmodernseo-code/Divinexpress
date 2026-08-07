'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { WhatsAppBubble } from './WhatsAppBubble';
import { CartDrawer } from '@/components/cart/CartDrawer';

const adminSegments = ['/connexion', '/dashboard', '/produits', '/commandes', '/retours', '/messages', '/clients', '/parametres'];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = adminSegments.some((segment) => pathname.includes(segment));
  if (isAdmin) return <>{children}</>;
  return <><Header /><main>{children}</main><Footer /><CookieBanner /><CartDrawer /><WhatsAppBubble /></>;
}
