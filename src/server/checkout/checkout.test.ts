// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { DevelopmentNotificationProvider } from '../notifications/development-provider';
import { DevelopmentPaymentProvider } from '../payments/development-provider';
import { CheckoutService } from './service';

describe('CheckoutService with development providers', () => {
  let database: Database;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('category:test', 'test', 'Test', 'Test');
    await database.prepare(`INSERT INTO products
      (id, category_id, slug, name_fr, name_en, status) VALUES (?, ?, ?, ?, ?, 'active')`)
      .run('product-1', 'category:test', 'veste', 'Veste', 'Jacket');
    await database.prepare(`INSERT INTO product_variants
      (id, product_id, sku, price_minor, currency) VALUES (?, ?, ?, ?, ?)`)
      .run('variant-1', 'product-1', 'VESTE', 10000, 'EUR');
    await database.prepare(`INSERT INTO inventory_movements
      (id, variant_id, quantity_delta, reason) VALUES (?, ?, ?, 'initial')`)
      .run('stock-1', 'variant-1', 3);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  const request = {
    idempotencyKey: 'checkout-payment-123', currency: 'EUR' as const,
    customer: { email: 'client@example.com', firstName: 'Ada', lastName: 'Lovelace', phone: null },
    shippingAddress: { recipient: 'Ada', line1: '1 rue Reign', line2: null, postalCode: '75001', city: 'Paris', region: null, countryCode: 'FR' },
    lines: [{ variantId: 'variant-1', quantity: 1 }], shippingMinor: 0, taxMinor: 0, discountMinor: 0,
  };

  it('records a successful development payment and queues confirmation once', async () => {
    const checkout = new CheckoutService(
      database,
      new DevelopmentPaymentProvider('succeed'),
      new DevelopmentNotificationProvider(database),
    );
    const first = await checkout.start(request);
    const second = await checkout.start(request);

    expect(first.order.status).toBe('paid');
    expect(first.payment.status).toBe('paid');
    expect(second.order.id).toBe(first.order.id);
    const deliveries = (await database.prepare('SELECT COUNT(*) AS count FROM notification_deliveries').get()) as { count: number };
    expect(deliveries.count).toBe(1);
  });

  it('records a failed development payment without marking the order paid', async () => {
    const checkout = new CheckoutService(
      database,
      new DevelopmentPaymentProvider('fail'),
      new DevelopmentNotificationProvider(database),
    );
    const result = await checkout.start({ ...request, idempotencyKey: 'checkout-payment-fail' });
    expect(result.payment.status).toBe('failed');
    expect(result.order.status).toBe('pending_payment');
  });
});
