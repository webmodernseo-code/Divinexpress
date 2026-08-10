// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { DomainError } from '../domain/errors';
import { CatalogRepository } from './repository';

describe('CatalogRepository', () => {
  let database: Database;
  let repository: CatalogRepository;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('category:test', 'test', 'Test', 'Test');
    repository = new CatalogRepository(database);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('creates a product with variants and returns current stock', async () => {
    await repository.createProduct({
      id: 'product-1', categoryId: 'category:test', slug: 'veste-test',
      nameFr: 'Veste test', nameEn: 'Test jacket', descriptionFr: '', descriptionEn: '',
      variants: [{ id: 'variant-1', sku: 'TEST-001', size: 'M', color: 'Noir', priceMinor: 12500, currency: 'EUR' }],
    });
    await repository.adjustInventory({ variantId: 'variant-1', quantityDelta: 8, reason: 'initial' });
    await repository.adjustInventory({ variantId: 'variant-1', quantityDelta: -3, reason: 'sale' });

    expect((await repository.findBySlug('veste-test'))?.variants[0]).toMatchObject({
      sku: 'TEST-001', stock: 5, priceMinor: 12500,
    });
  });

  it('rejects duplicate SKUs and stock below zero', async () => {
    const input = {
      id: 'product-1', categoryId: 'category:test', slug: 'veste-test',
      nameFr: 'Veste test', nameEn: 'Test jacket', descriptionFr: '', descriptionEn: '',
      variants: [{ id: 'variant-1', sku: 'TEST-001', size: 'M', color: 'Noir', priceMinor: 12500, currency: 'EUR' as const }],
    };
    await repository.createProduct(input);
    await expect(repository.createProduct({ ...input, id: 'product-2', slug: 'autre' }))
      .rejects.toThrowError(DomainError);
    await expect(repository.adjustInventory({ variantId: 'variant-1', quantityDelta: -1, reason: 'sale' }))
      .rejects.toThrowError(new DomainError('CONFLICT', 'Insufficient stock'));
  });

  it('archives products instead of deleting historical catalog records', async () => {
    await repository.createProduct({
      id: 'product-1', categoryId: 'category:test', slug: 'veste-test',
      nameFr: 'Veste test', nameEn: 'Test jacket', descriptionFr: '', descriptionEn: '',
      variants: [{ id: 'variant-1', sku: 'TEST-001', size: null, color: null, priceMinor: 12500, currency: 'EUR' }],
    });
    await repository.archiveProduct('product-1');
    expect(await repository.findBySlug('veste-test')).toBeNull();
    expect((await repository.listProducts({ includeArchived: true }))[0].status).toBe('archived');
  });

  it('updates dashboard base price across variants and sets aggregate stock', async () => {
    await repository.createProduct({
      id: 'product-1', categoryId: 'category:test', slug: 'veste-test',
      nameFr: 'Veste test', nameEn: 'Test jacket', descriptionFr: '', descriptionEn: '',
      variants: [
        { id: 'variant-1', sku: 'TEST-M', size: 'M', color: 'Noir', priceMinor: 12500, currency: 'EUR' },
        { id: 'variant-2', sku: 'TEST-L', size: 'L', color: 'Noir', priceMinor: 13500, currency: 'EUR' },
      ],
    });
    await repository.adjustInventory({ variantId: 'variant-1', quantityDelta: 3, reason: 'initial' });
    await repository.adjustInventory({ variantId: 'variant-2', quantityDelta: 4, reason: 'initial' });
    await database.prepare(`INSERT INTO admin_users (id, email, password_hash, role)
      VALUES ('admin-1', 'admin@example.com', 'test-hash', 'owner')`).run();

    await repository.setBasePrice('product-1', 14900);
    await repository.setAggregateStock('product-1', 10, 'admin-1');

    const product = await repository.findBySlug('veste-test');
    expect(product?.variants.map((variant) => variant.priceMinor)).toEqual([14900, 14900]);
    expect(product?.variants.reduce((total, variant) => total + variant.stock, 0)).toBe(10);
  });
});
