import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { fraunces, inter } from '@/lib/fonts';
import { organizationJsonLd, SITE_URL } from '@/lib/seo';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { CartDrawerProvider } from '@/context/CartDrawerContext';
import { CheckoutProvider } from '@/context/CheckoutContext';
import { SiteChrome } from '@/components/layout/SiteChrome';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DivinExpress — Mode femme, homme et enfant',
    template: '%s'
  },
  description:
    'DivinExpress est une plateforme de shopping en ligne de vêtements et accessoires pour femme, homme et enfant.',
  keywords: [
    'vêtements homme femme enfant',
    'boutique en ligne vêtements',
    'accessoires mode',
    'mode femme',
    'mode homme',
    'mode enfant',
    'DivinExpress'
  ],
  openGraph: {
    title: 'DivinExpress — Mode femme, homme et enfant',
    description:
      'Plateforme de shopping en ligne de vêtements et accessoires pour femme, homme et enfant.',
    url: SITE_URL,
    siteName: 'DivinExpress',
    images: [{ url: `${SITE_URL}/branding/logo-divinexpress.png` }],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DivinExpress — Mode femme, homme et enfant',
    description:
      'Plateforme de shopping en ligne de vêtements et accessoires pour femme, homme et enfant.',
    images: [`${SITE_URL}/branding/logo-divinexpress.png`]
  }
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <NextIntlClientProvider messages={messages}>
          <CurrencyProvider initialLocale={locale}>
            <CartProvider>
              <FavoritesProvider>
                <CartDrawerProvider>
                  <CheckoutProvider>
                    <SiteChrome>{children}</SiteChrome>
                  </CheckoutProvider>
                </CartDrawerProvider>
              </FavoritesProvider>
            </CartProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
