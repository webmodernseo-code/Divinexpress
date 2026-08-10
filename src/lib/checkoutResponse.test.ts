// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readCheckoutResponse } from './checkoutResponse';

describe('readCheckoutResponse', () => {
  it('returns a validated successful checkout result', async () => {
    const response = Response.json({ orderNumber: 'RG-20260810-ABC12345' });
    await expect(readCheckoutResponse(response)).resolves.toEqual({ orderNumber: 'RG-20260810-ABC12345' });
  });

  it('rejects failed HTTP responses so the cart is preserved', async () => {
    const response = Response.json({ error: 'CONFLICT' }, { status: 409 });
    await expect(readCheckoutResponse(response)).rejects.toThrow('CONFLICT');
  });

  it('rejects malformed successful payloads', async () => {
    const response = Response.json({ ok: true });
    await expect(readCheckoutResponse(response)).rejects.toThrow('INVALID_CHECKOUT_RESPONSE');
  });
});
