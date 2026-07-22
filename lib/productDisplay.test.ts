import { describe, it, expect } from 'vitest';
import { totalStock, priceRange } from './productDisplay';

describe('totalStock', () => {
  it('sums stock across variants', () => {
    expect(totalStock([{ stock: 3 }, { stock: 5 }, { stock: 0 }])).toBe(8);
  });

  it('returns 0 for no variants', () => {
    expect(totalStock([])).toBe(0);
  });
});

describe('priceRange', () => {
  it('returns null for no variants', () => {
    expect(priceRange([])).toBeNull();
  });

  it('returns the same min and max for a single variant', () => {
    expect(priceRange([{ priceCents: 4990 }])).toEqual({ minCents: 4990, maxCents: 4990 });
  });

  it('returns the min and max across variants', () => {
    expect(priceRange([{ priceCents: 4990 }, { priceCents: 3990 }, { priceCents: 5990 }])).toEqual({
      minCents: 3990,
      maxCents: 5990
    });
  });
});
