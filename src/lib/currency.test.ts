import { describe, expect, it } from 'vitest';
import { convertFromEur, formatPrice, defaultCurrencyForLocale } from './currency';

describe('convertFromEur', () => {
  it('returns the same amount for EUR', () => {
    expect(convertFromEur(100, 'EUR')).toBe(100);
  });

  it('applies the fixed rate for GBP', () => {
    expect(convertFromEur(100, 'GBP')).toBeCloseTo(86, 5);
  });
});

describe('formatPrice', () => {
  it('formats EUR amounts with the French locale', () => {
    const formatted = formatPrice(100, 'EUR', 'fr');
    expect(formatted).toContain('100');
    expect(formatted).toMatch(/€/);
  });

  it('formats GBP amounts with the English locale', () => {
    const formatted = formatPrice(100, 'GBP', 'en');
    expect(formatted).toMatch(/£/);
  });
});

describe('defaultCurrencyForLocale', () => {
  it('defaults French to EUR', () => {
    expect(defaultCurrencyForLocale('fr')).toBe('EUR');
  });

  it('defaults English to GBP', () => {
    expect(defaultCurrencyForLocale('en')).toBe('GBP');
  });
});
