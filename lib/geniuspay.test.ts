import { describe, it, expect } from 'vitest';
import { eurCentsToXof } from './geniuspay';

describe('eurCentsToXof', () => {
  it('converts 100.00 EUR to its XOF equivalent at the fixed peg', () => {
    // 100 EUR * 655.957 = 65595.7 -> rounds to 65596
    expect(eurCentsToXof(10000)).toBe(65596);
  });

  it('converts a single cent and rounds to the nearest XOF', () => {
    // 0.01 EUR * 655.957 = 6.55957 -> rounds to 7
    expect(eurCentsToXof(1)).toBe(7);
  });

  it('converts zero to zero', () => {
    expect(eurCentsToXof(0)).toBe(0);
  });
});
