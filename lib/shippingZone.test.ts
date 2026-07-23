import { describe, it, expect } from 'vitest';
import { resolveShippingZone } from './shippingZone';

const zones = [
  { countries: ['FR', 'GB'] },
  { countries: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'] }
];

describe('resolveShippingZone', () => {
  it('finds the Europe zone (index 0) for FR', () => {
    expect(resolveShippingZone('FR', zones)).toBe(0);
  });

  it('finds the Afrique zone (index 1) for SN', () => {
    expect(resolveShippingZone('SN', zones)).toBe(1);
  });

  it('returns -1 for a country in no zone', () => {
    expect(resolveShippingZone('US', zones)).toBe(-1);
  });

  it('returns -1 for an empty zones list', () => {
    expect(resolveShippingZone('FR', [])).toBe(-1);
  });
});
