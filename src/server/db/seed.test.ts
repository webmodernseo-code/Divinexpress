// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase } from './client';
import { migrateDatabase } from './migrate';
import { seedDevelopmentDatabase } from './seed';

const expectedImageUrls = [
  '/image/promotions/carroussel1.png',
  '/image/promotions/carroussel2.png',
  '/image/promotions/carrousel3.png',
  '/image/promotions/carrousel4.png',
  '/image/promotions/carroussel5.png',
  '/image/promotions/carroussel6.png',
  '/image/promotions/carroussel7.png',
  '/image/promotions/carroussel8.png',
  '/image/promotions/carroussel9.png',
  '/image/promotions/carroussel10.png',
];

describe('development promotion-slide seed', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('creates exactly ten active, category-linked slides with the supplied local URLs idempotently', async () => {
    const database = createDatabase(':memory:');
    await migrateDatabase(database);

    await seedDevelopmentDatabase(database);
    await seedDevelopmentDatabase(database);

    const slides = (await database.prepare(`SELECT s.image_url, s.active, s.position, p.status,
      c.slug AS category_slug FROM promotion_slides s
      JOIN products p ON p.id = s.product_id
      JOIN categories c ON c.id = p.category_id
      ORDER BY s.position`).all()) as Array<{
      image_url: string; active: number; position: number; status: string; category_slug: string;
    }>;
    expect(slides).toHaveLength(10);
    expect(slides.map((slide) => slide.image_url)).toEqual(expectedImageUrls);
    expect(slides.map((slide) => slide.active)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(slides.map((slide) => slide.status)).toEqual([
      'active', 'active', 'active', 'active', 'active',
      'active', 'active', 'active', 'active', 'active',
    ]);
    expect(slides.map((slide) => slide.category_slug)).toEqual([
      'homme', 'femme', 'enfant', 'accessoires', 'homme',
      'femme', 'enfant', 'accessoires', 'homme', 'femme',
    ]);
  });
});
