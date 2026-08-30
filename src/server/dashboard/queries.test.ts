// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { getDashboardState } from './queries';
import type { Database } from '../db/client';

describe('getDashboardState', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('derives metrics from persisted orders instead of demo constants', async () => {
    const database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare(`INSERT INTO customers (id, email, first_name, last_name)
      VALUES ('customer-1', 'ada@example.com', 'Ada', 'Lovelace')`).run();
    await database.prepare(`INSERT INTO orders
      (id, number, customer_id, idempotency_key, status, currency, subtotal_minor,
       shipping_minor, tax_minor, discount_minor, total_minor, shipping_address_json, created_at)
      VALUES ('order-1', 'RG-1', 'customer-1', 'key-12345678', 'paid', 'EUR',
       10000, 0, 0, 0, 10000, '{}', '2026-08-04T10:00:00.000Z')`).run();

    const state = await getDashboardState(database, '30d', new Date('2026-08-04T12:00:00.000Z'));
    expect(state.metrics.find((metric) => metric.id === 'orders')?.value).toBe('1');
    expect(state.metrics.find((metric) => metric.id === 'revenue')?.value).toContain('100');
    expect(state.recentOrders[0]).toMatchObject({ id: 'RG-1', customer: 'Ada Lovelace' });
  });

  it('does not reference a select alias from the PostgreSQL HAVING clause', async () => {
    const database = {
      prepare(sql: string) {
        if (/HAVING\s+remaining/i.test(sql)) {
          throw new Error('column "remaining" does not exist');
        }
        return {
          async get() { return { orders: 0, revenue: 0, basket: 0, returns: 0 }; },
          async all() { return []; },
          async run() { return { changes: 0, lastInsertRowid: 0 }; },
        };
      },
      async exec() {},
      async close() {},
    } as Database;

    await expect(getDashboardState(database, '30d')).resolves.toMatchObject({
      recentOrders: [],
      stockAlerts: [],
    });
  });
});
