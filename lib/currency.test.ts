import { describe, it, expect } from 'vitest';
import { currencyForLocale } from './currency';

describe('currencyForLocale', () => {
  it('returns euros for fr', () => {
    expect(currencyForLocale('fr')).toEqual({ symbol: '€', code: 'EUR' });
  });

  it('returns pounds for en', () => {
    expect(currencyForLocale('en')).toEqual({ symbol: '£', code: 'GBP' });
  });
});
