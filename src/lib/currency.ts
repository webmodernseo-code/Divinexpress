export type CurrencyCode = 'EUR' | 'GBP';

export const FIXED_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  GBP: 0.86
};

export function convertFromEur(amountEur: number, currency: CurrencyCode): number {
  return amountEur * FIXED_RATES[currency];
}

export function formatPrice(amountEur: number, currency: CurrencyCode, locale: string): string {
  const converted = convertFromEur(amountEur, currency);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(converted);
}

export function defaultCurrencyForLocale(locale: string): CurrencyCode {
  return locale === 'en' ? 'GBP' : 'EUR';
}
