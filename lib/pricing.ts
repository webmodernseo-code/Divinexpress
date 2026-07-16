import type { Locale } from '@/i18n';
import { currencyForLocale } from './currency';

export type PriceInfo = {
  priceCents: number;
  compareAtPriceCents: number | null;
};

export function isOnSale({ priceCents, compareAtPriceCents }: PriceInfo): boolean {
  return compareAtPriceCents !== null && compareAtPriceCents > priceCents;
}

export function formatPrice(cents: number, locale: Locale): string {
  const { symbol } = currencyForLocale(locale);
  const amount = (cents / 100).toFixed(2).replace('.', ',');
  return `${amount} ${symbol}`;
}
