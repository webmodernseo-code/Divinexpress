// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { CatalogRepository } from './repository';
import { StorefrontCatalog } from './storefront';

describe('StorefrontCatalog', () => {
  let database: Database;
  let repository: CatalogRepository;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('category:homme', 'homme', 'Homme', 'Men');
    repository = new CatalogRepository(database);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('reflects persisted dashboard price, translations, variants, and stock', async () => {
    await repository.createProduct({
      id: 'hoodie-1', categoryId: 'category:homme', slug: 'hoodie-test',
      nameFr: 'Sweat test', nameEn: 'Test hoodie', descriptionFr: 'Description FR', descriptionEn: 'Description EN',
      variants: [
        { id: 'variant-black-m', sku: 'HOOD-M-BLK', size: 'M', color: 'Noir', priceMinor: 12900, currency: 'EUR' },
        { id: 'variant-white-l', sku: 'HOOD-L-WHT', size: 'L', color: 'Blanc', priceMinor: 12900, currency: 'EUR' },
      ],
    });
    await repository.adjustInventory({ variantId: 'variant-black-m', quantityDelta: 3, reason: 'initial' });

    const product = await new StorefrontCatalog(database).findBySlug('hoodie-test');

    expect(product).toMatchObject({
      id: 'hoodie-1', category: 'homme', priceEur: 129,
      name: { fr: 'Sweat test', en: 'Test hoodie' },
      sizes: ['M', 'L'], colors: ['Noir', 'Blanc'], availableQuantity: 3,
    });
  });

  it('exposes only active products and returns null for archived products', async () => {
    await repository.createProduct({
      id: 'product-1', categoryId: 'category:homme', slug: 'active-product',
      nameFr: 'Actif', nameEn: 'Active', descriptionFr: '', descriptionEn: '',
      variants: [{ id: 'variant-1', sku: 'ACTIVE-1', size: null, color: null, priceMinor: 5000, currency: 'EUR' }],
    });
    await repository.archiveProduct('product-1');

    expect(await new StorefrontCatalog(database).list()).toEqual([]);
    expect(await new StorefrontCatalog(database).findBySlug('active-product')).toBeNull();
  });
});
