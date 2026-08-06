'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { CartDrawer } from '../cart/CartDrawer';
import { ReactNode } from 'react';

type EcommerceLayoutWrapperProps = {
  children: ReactNode;
};

const ADMIN_ROUTES = [
  '/connexion',
  '/dashboard',
  '/produits',
  '/commandes',
  '/retours',
  '/messages',
  '/parametres',
  '/mot-de-passe-oublie',
  '/verification-2fa'
];

export function EcommerceLayoutWrapper({ children }: EcommerceLayoutWrapperProps) {
  const pathname = usePathname();

  // Strip locale prefix from pathname to check if it's an admin route
  // e.g. "/fr/dashboard" -> "/dashboard"
  const normalizedPath = pathname ? pathname.replace(/^\/[a-z]{2}(\/|$)/, '/') : '/';

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) => normalizedPath === route || normalizedPath.startsWith(route + '/')
  );

  if (isAdminRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
      <CartDrawer />
    </>
  );
}
