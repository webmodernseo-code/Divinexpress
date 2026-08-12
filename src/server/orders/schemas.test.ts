import { describe, it, expect } from 'vitest';
import { createOrderInputSchema } from './schemas';

const base = {
  idempotencyKey: 'abcd1234',
  currency: 'EUR' as const,
  customer: { email: 'a@b.fr', firstName: 'A', lastName: 'B', phone: '+221770000000' },
  lines: [{ variantId: 'v1', quantity: 1 }],
  shippingMinor: 0,
  taxMinor: 0,
  discountMinor: 0
};

describe('createOrderInputSchema', () => {
  it('accepts null city/postalCode (Africa case)', () => {
    const parsed = createOrderInputSchema.safeParse({
      ...base,
      shippingAddress: {
        recipient: 'A B', line1: 'Quartier X', line2: null,
        postalCode: null, city: null, region: null, countryCode: 'SN'
      }
    });
    expect(parsed.success).toBe(true);
  });

  it('still accepts a full European address', () => {
    const parsed = createOrderInputSchema.safeParse({
      ...base,
      shippingAddress: {
        recipient: 'A B', line1: '1 Rue X', line2: null,
        postalCode: '75001', city: 'Paris', region: null, countryCode: 'fr'
      }
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.shippingAddress.countryCode).toBe('FR');
  });

  it('rejects an empty-string city (must be null or non-empty)', () => {
    const parsed = createOrderInputSchema.safeParse({
      ...base,
      shippingAddress: {
        recipient: 'A B', line1: '1 Rue X', line2: null,
        postalCode: '75001', city: '', region: null, countryCode: 'FR'
      }
    });
    expect(parsed.success).toBe(false);
  });
});
