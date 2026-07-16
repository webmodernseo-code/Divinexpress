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
  const { code } = currencyForLocale(locale);
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(cents / 100);
}

export function cheapestVariant<T extends PriceInfo>(variants: T[]): T | null {
  if (variants.length === 0) return null;
  return variants.reduce((min, variant) => (variant.priceCents < min.priceCents ? variant : min), variants[0]);
}
