// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_STORE_SETTINGS } from '@/server/settings/store-settings';

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  getCommerceDatabase: vi.fn(),
  readStoreSettings: vi.fn(),
}));

vi.mock('@/server/db/runtime', () => ({ getCommerceDatabase: mocks.getCommerceDatabase }));
vi.mock('@/server/settings/store-settings', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/server/settings/store-settings')>();
  return { ...original, readStoreSettings: mocks.readStoreSettings };
});
vi.mock('@/server/checkout/service', () => ({ CheckoutService: class { start = mocks.start; } }));
vi.mock('@/server/payments/stripe-provider', () => ({ StripePaymentProvider: class {} }));
vi.mock('@/server/payments/genius-provider', () => ({ GeniusPaymentProvider: class {} }));
vi.mock('@/server/notifications/development-provider', () => ({ DevelopmentNotificationProvider: class {} }));

import { GET, POST } from './route';

describe('checkout settings integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'stripe-secret';
    mocks.readStoreSettings.mockResolvedValue(DEFAULT_STORE_SETTINGS);
    mocks.getCommerceDatabase.mockResolvedValue({
      prepare: (sql: string) => ({
        get: vi.fn().mockResolvedValue(sql.includes('store_settings') ? undefined : { id: 'variant-1', price_minor: 5000 }),
      }),
    });
    mocks.start.mockResolvedValue({ order: { id: 'order-1', number: 'DX-1', status: 'pending_payment' }, payment: { status: 'pending' }, checkoutUrl: 'https://pay.example.com' });
  });

  it('passes configured shipping to order creation', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.start).toHaveBeenCalledWith(expect.objectContaining({ shippingMinor: 990 }));
  });

  it('blocks checkout while the shop is closed', async () => {
    mocks.readStoreSettings.mockResolvedValue({ ...DEFAULT_STORE_SETTINGS, shop_enabled: false });
    const response = await POST(request());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'SHOP_CLOSED' });
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it('reports an enabled payment region whose provider still needs configuration', async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const response = await GET(new Request('http://localhost/api/checkout?region=europe'));

    await expect(response.json()).resolves.toMatchObject({
      shopClosed: false,
      region: { enabled: true, providerConfigured: false, status: 'provider_missing' },
    });
  });

  it('reports a disabled payment region separately from provider configuration', async () => {
    mocks.readStoreSettings.mockResolvedValue({ ...DEFAULT_STORE_SETTINGS, payment_africa_enabled: false });

    const response = await GET(new Request('http://localhost/api/checkout?region=africa'));

    await expect(response.json()).resolves.toMatchObject({
      shopClosed: false,
      region: { enabled: false, status: 'disabled' },
    });
  });
});

function request() {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      idempotencyKey: 'checkout-12345678',
      method: 'stripe',
      shipping: { fullName: 'Ada Lovelace', email: 'ada@example.com', address: '1 Rue de Paris', country: 'France', countryCode: 'FR', region: 'europe' },
      items: [{ productId: 'product-1', size: 'M', color: 'Noir', quantity: 2 }],
    }),
  });
}
