// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase } from './client';
import { migrateDatabase } from './migrate';

describe('migration 0003 — compare_at_price_minor', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('adds a nullable compare_at_price_minor column to product_variants', async () => {
    const db = createDatabase(':memory:');
    await migrateDatabase(db);

    const columns = (await db.prepare("SELECT name FROM pragma_table_info('product_variants')")
      .all()) as Array<{ name: string }>;
    expect(columns.map((c) => c.name)).toContain('compare_at_price_minor');

    // Column accepts NULL and integer values.
    await db.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('cat-1', 'homme', 'Homme', 'Men');
    await db.prepare(`INSERT INTO products (id, category_id, slug, name_fr, name_en, status)
      VALUES (?, ?, ?, ?, ?, 'active')`).run('p1', 'cat-1', 'p', 'P', 'P');
    await db.prepare(`INSERT INTO product_variants
      (id, product_id, sku, price_minor, currency, compare_at_price_minor)
      VALUES (?, ?, ?, ?, ?, ?)`).run('v1', 'p1', 'SKU', 7900, 'EUR', 9900);

    const row = (await db.prepare('SELECT compare_at_price_minor FROM product_variants WHERE id = ?')
      .get('v1')) as { compare_at_price_minor: number | null };
    expect(row.compare_at_price_minor).toBe(9900);
  });
});
