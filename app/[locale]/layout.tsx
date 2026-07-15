import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import '@/app/styles/tokens.css';
import styles from './layout.module.css';

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

  const messages = await getMessages();
  const t = await getTranslations('layout');

  return (
    <html lang={params.locale}>
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <header className={styles.header}>
            <span className={styles.brand}>{t('brand')}</span>
          </header>
          <main>{children}</main>
          <footer className={styles.footer}>
            © {new Date().getFullYear()} DivinExpress — {t('footer')}
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
