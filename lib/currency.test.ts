import { describe, it, expect } from 'vitest';
import { currencyForLocale, convertEurCentsToLocaleCents } from './currency';

describe('currencyForLocale', () => {
  it('returns euros for fr', () => {
    expect(currencyForLocale('fr')).toEqual({ symbol: '€', code: 'EUR' });
  });

  it('returns pounds for en', () => {
    expect(currencyForLocale('en')).toEqual({ symbol: '£', code: 'GBP' });
  });
});

describe('convertEurCentsToLocaleCents', () => {
  it('returns the amount unchanged for fr', () => {
    expect(convertEurCentsToLocaleCents(8900, 'fr')).toBe(8900);
  });

  it('converts to GBP at the fixed rate for en', () => {
    expect(convertEurCentsToLocaleCents(8900, 'en')).toBe(7743);
  });

  it('converts 0 to 0 regardless of locale', () => {
    expect(convertEurCentsToLocaleCents(0, 'fr')).toBe(0);
    expect(convertEurCentsToLocaleCents(0, 'en')).toBe(0);
  });

  it('rounds the converted amount for en', () => {
    expect(convertEurCentsToLocaleCents(101, 'en')).toBe(88);
  });
});
