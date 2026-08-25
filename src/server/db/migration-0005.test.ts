// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase } from './client';
import { migrateDatabase } from './migrate';

describe('migration 0005 — promotion slides', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('creates a strict promotion-slides table with its product relationship', async () => {
    const database = createDatabase(':memory:');
    await migrateDatabase(database);

    const columns = (await database.prepare("SELECT name FROM pragma_table_info('promotion_slides')")
      .all()) as Array<{ name: string }>;
    expect(columns.map((column) => column.name)).toEqual([
      'id', 'image_url', 'product_id', 'position', 'active', 'created_at', 'updated_at',
    ]);

    await expect(database.prepare(`INSERT INTO promotion_slides
      (id, image_url, product_id, position) VALUES (?, ?, ?, ?)`)
      .run('slide-missing-product', '/image/promotions/carroussel1.png', 'missing-product', 0))
      .rejects.toThrow();
  });

  it('enforces the full table contract, defaults, cascade, and ordering index', async () => {
    const database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('category:test', 'test', 'Test', 'Test');
    await database.prepare(`INSERT INTO products
      (id, category_id, slug, name_fr, name_en, status) VALUES (?, ?, ?, ?, ?, 'active')`)
      .run('product:test', 'category:test', 'test-product', 'Produit test', 'Test product');

    const table = (await database.prepare("SELECT strict FROM pragma_table_list WHERE name = 'promotion_slides'")
      .get()) as { strict: number };
    expect(table.strict).toBe(1);

    const columns = (await database.prepare("SELECT name, dflt_value FROM pragma_table_info('promotion_slides')")
      .all()) as Array<{ name: string; dflt_value: string | null }>;
    expect(columns.find((column) => column.name === 'active')?.dflt_value).toBe('1');
    expect(columns.find((column) => column.name === 'created_at')?.dflt_value).toBe('CURRENT_TIMESTAMP');
    expect(columns.find((column) => column.name === 'updated_at')?.dflt_value).toBe('CURRENT_TIMESTAMP');

    await database.prepare(`INSERT INTO promotion_slides
      (id, image_url, product_id, position) VALUES (?, ?, ?, ?)`)
      .run('slide-cascade', '/image/promotions/carroussel1.png', 'product:test', 0);
    await expect(database.prepare(`INSERT INTO promotion_slides
      (id, image_url, product_id, position, active) VALUES (?, ?, ?, ?, ?)`)
      .run('slide-invalid-active', '/image/promotions/carroussel2.png', 'product:test', 1, 2))
      .rejects.toThrow();

    const indexColumns = (await database.prepare(
      "SELECT name FROM pragma_index_info('idx_promotion_slides_active_position') ORDER BY seqno",
    ).all()) as Array<{ name: string }>;
    expect(indexColumns.map((column) => column.name)).toEqual(['active', 'position']);

    await database.prepare('DELETE FROM products WHERE id = ?').run('product:test');
    await expect(database.prepare('SELECT id FROM promotion_slides WHERE id = ?').get('slide-cascade'))
      .resolves.toBeUndefined();
  });

  it('remains idempotent through the migration runner', async () => {
    const database = createDatabase(':memory:');
    await migrateDatabase(database);
    await migrateDatabase(database);

    const applied = await database.prepare(
      "SELECT id FROM schema_migrations WHERE id = '0005_promotion_slides'",
    ).get();
    expect(applied).toEqual({ id: '0005_promotion_slides' });
  });
});
