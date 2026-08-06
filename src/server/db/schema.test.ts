// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase } from './client';
import { migrateDatabase } from './migrate';
import { seedDevelopmentDatabase } from './seed';

describe('database migrations', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('creates the commerce schema and enforces relationships', async () => {
    const db = createDatabase(':memory:');
    await migrateDatabase(db);

    await db.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('cat-1', 'homme', 'Homme', 'Men');
    await db.prepare(`INSERT INTO products
      (id, category_id, slug, name_fr, name_en, status)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run('product-1', 'cat-1', 'chemise', 'Chemise', 'Shirt', 'active');
    await db.prepare(`INSERT INTO product_variants
      (id, product_id, sku, price_minor, currency)
      VALUES (?, ?, ?, ?, ?)`)
      .run('variant-1', 'product-1', 'REIGN-SHIRT-M', 9900, 'EUR');

    const variant = (await db.prepare('SELECT sku, price_minor FROM product_variants WHERE id = ?')
      .get('variant-1')) as { sku: string; price_minor: number };
    expect(variant).toEqual({ sku: 'REIGN-SHIRT-M', price_minor: 9900 });

    await expect(db.prepare(`INSERT INTO product_variants
      (id, product_id, sku, price_minor, currency)
      VALUES (?, ?, ?, ?, ?)`)
      .run('orphan', 'missing-product', 'ORPHAN', 100, 'EUR')).rejects.toThrow();
  });

  it('can run migrations more than once without changing the schema version', async () => {
    const db = createDatabase(':memory:');
    await migrateDatabase(db);
    await migrateDatabase(db);

    const migrations = (await db.prepare('SELECT COUNT(*) AS count FROM schema_migrations')
      .get()) as { count: number };
    expect(migrations.count).toBe(1);
  });

  it('seeds the existing storefront catalog idempotently', async () => {
    const db = createDatabase(':memory:');
    await migrateDatabase(db);

    await seedDevelopmentDatabase(db);
    await seedDevelopmentDatabase(db);

    const products = (await db.prepare('SELECT COUNT(*) AS count FROM products').get()) as { count: number };
    const variants = (await db.prepare('SELECT COUNT(*) AS count FROM product_variants').get()) as { count: number };
    const stock = (await db.prepare('SELECT SUM(quantity_delta) AS count FROM inventory_movements').get()) as { count: number };
    expect(products.count).toBe(17);
    expect(variants.count).toBeGreaterThan(17);
    expect(stock.count).toBe(variants.count * 25);
  });
});
