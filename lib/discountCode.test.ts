import { describe, it, expect } from 'vitest';
import { computeDiscountCents } from './discountCode';

describe('computeDiscountCents', () => {
  it('computes a percentage discount', () => {
    expect(computeDiscountCents(10000, 'PERCENT', 20)).toBe(2000);
  });

  it('rounds a percentage discount to the nearest cent', () => {
    expect(computeDiscountCents(333, 'PERCENT', 10)).toBe(33); // 33.3 rounds to 33
  });

  it('computes a fixed discount', () => {
    expect(computeDiscountCents(10000, 'FIXED', 1000)).toBe(1000);
  });

  it('clamps a fixed discount to the subtotal, never going negative', () => {
    expect(computeDiscountCents(3000, 'FIXED', 5000)).toBe(3000);
  });

  it('treats 100% as the full subtotal', () => {
    expect(computeDiscountCents(4785, 'PERCENT', 100)).toBe(4785);
  });
});
