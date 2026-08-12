import { describe, it, expect } from 'vitest';
import { EUROPE, AFRICA, countryName } from './countries';

describe('countries', () => {
  it('exposes ISO alpha-2 codes for both continents', () => {
    expect(EUROPE.find((c) => c.code === 'FR')).toBeTruthy();
    expect(AFRICA.find((c) => c.code === 'SN')).toBeTruthy();
    for (const c of [...EUROPE, ...AFRICA]) expect(c.code).toMatch(/^[A-Z]{2}$/);
  });

  it('has unique codes across both continents', () => {
    const codes = [...EUROPE, ...AFRICA].map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('returns a localized name by code', () => {
    expect(countryName('FR', 'fr')).toBe('France');
    expect(countryName('SN', 'en')).toBe('Senegal');
    expect(countryName('ZZ', 'fr')).toBe('ZZ');
  });
});
