import type { Locale } from '@/i18n';

const CURRENCY_BY_LOCALE: Record<Locale, { symbol: string; code: string }> = {
  fr: { symbol: '€', code: 'EUR' },
  en: { symbol: '£', code: 'GBP' }
};

export function currencyForLocale(locale: Locale): { symbol: string; code: string } {
  return CURRENCY_BY_LOCALE[locale];
}
