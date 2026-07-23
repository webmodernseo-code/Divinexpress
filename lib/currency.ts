import type { Locale } from '@/i18n';

const CURRENCY_BY_LOCALE: Record<Locale, { symbol: string; code: string }> = {
  fr: { symbol: '€', code: 'EUR' },
  en: { symbol: '£', code: 'GBP' }
};

export function currencyForLocale(locale: Locale): { symbol: string; code: string } {
  return CURRENCY_BY_LOCALE[locale];
}

// Fixed, display-only peg (not a live rate). The amount actually charged/settled
// always stays in EUR internally regardless of locale — this only affects what is shown.
const GBP_PER_EUR = 0.87;

export function convertEurCentsToLocaleCents(cents: number, locale: Locale): number {
  if (locale === 'en') {
    return Math.round(cents * GBP_PER_EUR);
  }
  return cents;
}
