// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { freeShippingRemainingEur, shippingMinorFor } from './shipping';

describe('shippingMinorFor', () => {
  it.each([
    [14999, 15000, 990],
    [15000, 15000, 0],
    [20000, 15000, 0],
  ])('calculates shipping for subtotal %s', (subtotalMinor, threshold, expected) => {
    expect(shippingMinorFor(subtotalMinor, { free_shipping_threshold_minor: threshold })).toBe(expected);
  });

  it('calculates the remaining amount from the configured threshold', () => {
    expect(freeShippingRemainingEur(120, 17500)).toBe(55);
    expect(freeShippingRemainingEur(180, 17500)).toBe(0);
  });
});
