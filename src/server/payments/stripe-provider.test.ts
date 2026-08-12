// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { StripePaymentProvider } from './stripe-provider';

afterEach(() => vi.unstubAllGlobals());

const request = {
  orderId: 'order-1', orderNumber: 'RG-2026-ABCD', amountMinor: 7900,
  currency: 'EUR' as const, idempotencyKey: 'idem-1',
};

describe('StripePaymentProvider', () => {
  it('creates a checkout session and returns its id + hosted url', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'cs_test_123', url: 'https://checkout.stripe.com/c/pay/cs_test_123' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await new StripePaymentProvider('sk_test_x').start(request);

    expect(result.providerReference).toBe('cs_test_123');
    expect(result.payload.checkoutUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
    expect(result.status).toBe('pending');

    const [url, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer sk_test_x');
  });

  it('throws when Stripe returns a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400, text: async () => 'bad request' })));
    await expect(new StripePaymentProvider('sk_test_x').start(request)).rejects.toThrow();
  });
});
