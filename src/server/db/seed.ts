import { CATEGORIES, ALL_PRODUCTS } from '@/lib/products';
import type { Database } from './client';

const categoryNames = {
  homme: { fr: 'Homme', en: 'Men' },
  femme: { fr: 'Femme', en: 'Women' },
  enfant: { fr: 'Enfant', en: 'Kids' },
  accessoires: { fr: 'Accessoires', en: 'Accessories' },
} as const;

function identifierPart(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
}

export async function seedDevelopmentDatabase(database: Database): Promise<void> {
  const insertCategory = database.prepare(`INSERT OR IGNORE INTO categories
    (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)`);
  const insertProduct = database.prepare(`INSERT OR IGNORE INTO products
    (id, category_id, slug, name_fr, name_en, description_fr, description_en, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`);
  const insertVariant = database.prepare(`INSERT OR IGNORE INTO product_variants
    (id, product_id, sku, size, color, price_minor, currency)
    VALUES (?, ?, ?, ?, ?, ?, 'EUR')`);
  const insertStock = database.prepare(`INSERT OR IGNORE INTO inventory_movements
    (id, variant_id, quantity_delta, reason, reference_type, reference_id)
    VALUES (?, ?, 25, 'initial', 'seed', 'storefront-v1')`);

  await database.exec('BEGIN IMMEDIATE');
  try {
    for (const category of CATEGORIES) {
      const names = categoryNames[category];
      await insertCategory.run(`category:${category}`, category, names.fr, names.en);
    }

    for (const product of ALL_PRODUCTS) {
      await insertProduct.run(
        product.id,
        `category:${product.category}`,
        product.slug,
        product.name.fr,
        product.name.en,
        product.description.fr,
        product.description.en,
      );

      for (const size of product.sizes) {
        for (const color of product.colors) {
          const variantId = `${product.id}:${identifierPart(size)}:${identifierPart(color)}`;
          const sku = `${product.id}-${size}-${identifierPart(color)}`.toUpperCase();
          await insertVariant.run(variantId, product.id, sku, size, color, Math.round(product.priceEur * 100));
          await insertStock.run(`stock:${variantId}`, variantId);
        }
      }
    }
    await database.exec('COMMIT');
  } catch (error) {
    await database.exec('ROLLBACK');
    throw error;
  }
}
