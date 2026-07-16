import { describe, it, expect } from 'vitest';
import { isOnSale, formatPrice, cheapestVariant } from './pricing';

describe('isOnSale', () => {
  it('is false when compareAtPriceCents is null', () => {
    expect(isOnSale({ priceCents: 8900, compareAtPriceCents: null })).toBe(false);
  });

  it('is false when compareAtPriceCents equals priceCents', () => {
    expect(isOnSale({ priceCents: 8900, compareAtPriceCents: 8900 })).toBe(false);
  });

  it('is true when compareAtPriceCents is greater than priceCents', () => {
    expect(isOnSale({ priceCents: 3200, compareAtPriceCents: 4500 })).toBe(true);
  });

  it('is false when compareAtPriceCents is less than priceCents', () => {
    expect(isOnSale({ priceCents: 4500, compareAtPriceCents: 3200 })).toBe(false);
  });
});

describe('formatPrice', () => {
  // Intl.NumberFormat('fr', ...) inserts a non-breaking space ( ) before the symbol.
  it('formats euros for fr', () => {
    expect(formatPrice(8900, 'fr')).toBe('89,00 €');
  });

  it('formats pounds for en with the same numeric amount', () => {
    expect(formatPrice(8900, 'en')).toBe('£89.00');
  });

  it('pads single-digit cents', () => {
    expect(formatPrice(100, 'fr')).toBe('1,00 €');
  });
});

describe('cheapestVariant', () => {
  it('returns null for an empty variants array', () => {
    expect(cheapestVariant([])).toBeNull();
  });

  it('returns the variant with the lowest priceCents', () => {
    const variants = [
      { priceCents: 9000, compareAtPriceCents: null },
      { priceCents: 3200, compareAtPriceCents: 4500 },
      { priceCents: 5000, compareAtPriceCents: null }
    ];
    expect(cheapestVariant(variants)).toBe(variants[1]);
  });
});
