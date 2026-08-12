// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { findOrderConfirmation } from './confirmation';

describe('findOrderConfirmation', () => {
  let database: Database;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare(`INSERT INTO customers (id, email, first_name, last_name)
      VALUES ('customer-1', 'alex@example.com', 'Alex', 'Martin')`).run();
    await database.prepare(`INSERT INTO orders
      (id, number, customer_id, idempotency_key, status, currency, subtotal_minor,
       shipping_minor, tax_minor, discount_minor, total_minor, shipping_address_json)
      VALUES ('order-1', 'RG-1001', 'customer-1', 'checkout-key-1001', 'paid', 'EUR',
       12000, 0, 0, 0, 12000, '{}')`).run();
  });

  afterEach(async () => closeDatabase());

  it('returns a public-safe persisted order summary', async () => {
    expect(await findOrderConfirmation(database, 'RG-1001')).toEqual({
      number: 'RG-1001', status: 'paid', currency: 'EUR', totalMinor: 12000,
    });
  });

  it('returns null for an unknown order reference', async () => {
    expect(await findOrderConfirmation(database, 'RG-404')).toBeNull();
  });
});
