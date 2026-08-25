// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { PromotionRepository } from './repository';

describe('PromotionRepository', () => {
  let database: Database;
  let repository: PromotionRepository;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('category:test', 'test', 'Test', 'Test');
    await database.prepare(`INSERT INTO products
      (id, category_id, slug, name_fr, name_en, status) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('product:active', 'category:test', 'produit-actif', 'Produit actif', 'Active product', 'active');
    await database.prepare(`INSERT INTO products
      (id, category_id, slug, name_fr, name_en, status) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('product:draft', 'category:test', 'produit-brouillon', 'Produit brouillon', 'Draft product', 'draft');
    repository = new PromotionRepository(database);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('publishes only active slides for active products in position order', async () => {
    await repository.create({
      imageUrl: '/image/promotions/active-later.png', productId: 'product:active', position: 4, active: true,
    });
    await repository.create({
      imageUrl: '/image/promotions/inactive-slide.png', productId: 'product:active', position: 1, active: false,
    });
    await repository.create({
      imageUrl: '/image/promotions/draft-product.png', productId: 'product:draft', position: 0, active: true,
    });
    const earliest = await repository.create({
      imageUrl: '/image/promotions/active-earlier.png', productId: 'product:active', position: 2, active: true,
    });

    await expect(repository.listPublished()).resolves.toEqual([
      expect.objectContaining({
        id: earliest.id,
        imageUrl: '/image/promotions/active-earlier.png',
        productId: 'product:active',
        productSlug: 'produit-actif',
        productNameFr: 'Produit actif',
        productNameEn: 'Active product',
        position: 2,
        active: true,
      }),
      expect.objectContaining({ imageUrl: '/image/promotions/active-later.png', position: 4 }),
    ]);
  });

  it('allows administrators to create, update, list, and delete a slide', async () => {
    const created = await repository.create({
      imageUrl: '/image/promotions/original.png', productId: 'product:active', position: 5,
    });
    await repository.update(created.id, { imageUrl: '/image/promotions/edited.png', active: false });

    await expect(repository.listAdmin()).resolves.toEqual([
      expect.objectContaining({
        id: created.id, imageUrl: '/image/promotions/edited.png', active: false, position: 5,
      }),
    ]);

    await repository.delete(created.id);
    await expect(repository.listAdmin()).resolves.toEqual([]);
  });

  it('stores the submitted reorder sequence at literal zero-based positions', async () => {
    const first = await repository.create({
      imageUrl: '/image/promotions/first.png', productId: 'product:active', position: 10,
    });
    const second = await repository.create({
      imageUrl: '/image/promotions/second.png', productId: 'product:active', position: 20,
    });
    const third = await repository.create({
      imageUrl: '/image/promotions/third.png', productId: 'product:active', position: 30,
    });

    await repository.reorder([third.id, first.id, second.id]);

    await expect(repository.listAdmin()).resolves.toEqual([
      expect.objectContaining({ id: third.id, position: 0 }),
      expect.objectContaining({ id: first.id, position: 1 }),
      expect.objectContaining({ id: second.id, position: 2 }),
    ]);
  });
});
