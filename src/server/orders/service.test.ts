// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { DomainError } from '../domain/errors';
import { OrderService } from './service';

describe('OrderService', () => {
  let database: Database;
  let service: OrderService;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('category:test', 'test', 'Test', 'Test');
    await database.prepare(`INSERT INTO products
      (id, category_id, slug, name_fr, name_en, status) VALUES (?, ?, ?, ?, ?, 'active')`)
      .run('product-1', 'category:test', 'veste', 'Veste', 'Jacket');
    await database.prepare(`INSERT INTO product_variants
      (id, product_id, sku, size, color, price_minor, currency) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('variant-1', 'product-1', 'VESTE-M', 'M', 'Noir', 10000, 'EUR');
    await database.prepare(`INSERT INTO inventory_movements
      (id, variant_id, quantity_delta, reason) VALUES (?, ?, ?, 'initial')`)
      .run('stock-1', 'variant-1', 5);
    service = new OrderService(database, () => new Date('2026-08-04T10:00:00.000Z'));
  });

  afterEach(async () => {
    await closeDatabase();
  });

  const input = {
    idempotencyKey: 'checkout-12345678', currency: 'EUR' as const,
    customer: { email: 'client@example.com', firstName: 'Ada', lastName: 'Lovelace', phone: null },
    shippingAddress: { recipient: 'Ada Lovelace', line1: '1 rue Reign', line2: null, postalCode: '75001', city: 'Paris', region: null, countryCode: 'FR' },
    lines: [{ variantId: 'variant-1', quantity: 2 }],
    shippingMinor: 500, taxMinor: 0, discountMinor: 1000,
  };

  it('recalculates totals, snapshots lines, and reserves stock atomically', async () => {
    const order = await service.createOrder(input);
    expect(order).toMatchObject({ subtotalMinor: 20000, totalMinor: 19500, status: 'pending_payment' });
    expect(order.items[0]).toMatchObject({ sku: 'VESTE-M', unitPriceMinor: 10000, quantity: 2, lineTotalMinor: 20000 });
    const stock = (await database.prepare('SELECT SUM(quantity_delta) AS stock FROM inventory_movements WHERE variant_id = ?')
      .get('variant-1')) as { stock: number };
    expect(stock.stock).toBe(3);
  });

  it('returns the original order for the same idempotency key without reserving twice', async () => {
    const first = await service.createOrder(input);
    const second = await service.createOrder(input);
    expect(second.id).toBe(first.id);
    const counts = (await database.prepare('SELECT COUNT(*) AS count FROM orders').get()) as { count: number };
    expect(counts.count).toBe(1);
  });

  it('rejects unavailable stock and mismatched currencies', async () => {
    await expect(service.createOrder({ ...input, lines: [{ variantId: 'variant-1', quantity: 6 }] }))
      .rejects.toThrowError(new DomainError('CONFLICT', 'Insufficient stock'));
    await expect(service.createOrder({ ...input, idempotencyKey: 'checkout-gbp-1234', currency: 'GBP' }))
      .rejects.toThrowError(new DomainError('CURRENCY_MISMATCH', 'Currencies must match'));
  });
});
