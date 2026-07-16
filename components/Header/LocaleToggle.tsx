'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n';
import { currencyForLocale } from '@/lib/currency';
import styles from './LocaleToggle.module.css';

export function LocaleToggle({ current }: { current: Locale }) {
  const pathname = usePathname();

  return (
    <div className={styles.toggle}>
      {locales.map((locale) => {
        const { symbol } = currencyForLocale(locale);
        const isActive = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
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
