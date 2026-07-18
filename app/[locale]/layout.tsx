import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { locales, type Locale } from '@/i18n';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { CartProvider } from '@/components/Cart/CartContext';
import { ToastProvider } from '@/components/Toast/ToastContext';
import { CartDrawer } from '@/components/Cart/CartDrawer';
import '@/app/styles/tokens.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'DivinExpress',
  description: 'DivinExpress — vêtements premium.'
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(params.locale as Locale)) notFound();

  setRequestLocale(params.locale);

  const messages = await getMessages();
  const locale = params.locale as Locale;

  return (
    <html lang={params.locale} className={inter.variable}>
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <ToastProvider>
            <CartProvider>
              <Header locale={locale} />
              <main>{children}</main>
              <Footer locale={locale} />
              <CartDrawer />
            </CartProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
