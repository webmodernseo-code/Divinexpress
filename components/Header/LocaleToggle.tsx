'use client';

import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n';
import { currencyForLocale } from '@/lib/currency';
import styles from './LocaleToggle.module.css';

export function LocaleToggle({ current }: { current: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const href = query ? `${pathname}?${query}` : pathname;

  return (
    <div className={styles.toggle}>
      {locales.map((locale) => {
        const { symbol } = currencyForLocale(locale);
        const isActive = locale === current;
        return (
          <Link
            key={locale}
            href={href}
            locale={locale}
            className={isActive ? styles.active : styles.inactive}
          >
            {locale.toUpperCase()} {symbol}
          </Link>
        );
      })}
    </div>
  );
}
