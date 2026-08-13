import { randomUUID } from 'node:crypto';
import type { Database } from '../db/client';
import { DomainError } from '../domain/errors';
import { createProductInputSchema, type CreateProductInput } from './schemas';

type ProductStatus = 'draft' | 'active' | 'archived';
type InventoryReason = 'initial' | 'adjustment' | 'reservation' | 'release' | 'sale' | 'return';

export interface CatalogVariant {
  id: string; sku: string; size: string | null; color: string | null;
  priceMinor: number; currency: 'EUR' | 'GBP'; stock: number;
}

export interface CatalogProduct {
  id: string; categoryId: string; slug: string; nameFr: string; nameEn: string;
  descriptionFr: string; descriptionEn: string; status: ProductStatus;
  images: string[]; compareAtMinor: number | null;
  variants: CatalogVariant[];
}

interface ProductRow {
  id: string; category_id: string; slug: string; name_fr: string; name_en: string;
  description_fr: string; description_en: string; status: ProductStatus;
}

interface VariantRow {
  id: string; product_id: string; sku: string; size: string | null; color: string | null;
  price_minor: number; currency: 'EUR' | 'GBP'; stock: number; compare_at_price_minor: number | null;
}

export class CatalogRepository {
  constructor(private readonly database: Database) {}

  async createProduct(rawInput: CreateProductInput): Promise<CatalogProduct> {
    const input = createProductInputSchema.parse(rawInput);
    await this.database.exec('BEGIN IMMEDIATE');
    try {
      await this.database.prepare(`INSERT INTO products
        (id, category_id, slug, name_fr, name_en, description_fr, description_en, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(input.id, input.categoryId, input.slug, input.nameFr, input.nameEn,
          input.descriptionFr, input.descriptionEn, input.status ?? 'active');
      const insertVariant = this.database.prepare(`INSERT INTO product_variants
        (id, product_id, sku, size, color, price_minor, currency, compare_at_price_minor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      const insertMovement = this.database.prepare(`INSERT INTO inventory_movements
        (id, variant_id, quantity_delta, reason) VALUES (?, ?, ?, 'initial')`);
      for (const variant of input.variants) {
        await insertVariant.run(variant.id, input.id, variant.sku, variant.size, variant.color,
          variant.priceMinor, variant.currency, input.compareAtPriceMinor ?? null);
        if ((variant.stock ?? 0) > 0) {
          await insertMovement.run(randomUUID(), variant.id, variant.stock);
        }
      }
      const insertMedia = this.database.prepare(`INSERT INTO product_media
        (id, product_id, url, position) VALUES (?, ?, ?, ?)`);
      const images = input.images ?? [];
      for (let index = 0; index < images.length; index += 1) {
        await insertMedia.run(randomUUID(), input.id, images[index], index);
      }
      await this.database.exec('COMMIT');
    } catch {
      await this.database.exec('ROLLBACK');
      throw new DomainError('CONFLICT', 'Product slug or SKU already exists');
    }
    return (await this.findBySlug(input.slug, true))!;
  }

  async listProducts(options: { includeArchived?: boolean } = {}): Promise<CatalogProduct[]> {
    const products = (await this.database.prepare(`SELECT id, category_id, slug, name_fr, name_en,
      description_fr, description_en, status FROM products
      ${options.includeArchived ? '' : "WHERE status <> 'archived'"} ORDER BY created_at, id`)
      .all()) as unknown as ProductRow[];
    if (products.length === 0) return [];
    const variants = (await this.database.prepare(`SELECT v.id, v.product_id, v.sku, v.size, v.color,
      v.price_minor, v.currency, v.compare_at_price_minor, COALESCE(SUM(m.quantity_delta), 0) AS stock
      FROM product_variants v LEFT JOIN inventory_movements m ON m.variant_id = v.id
      WHERE v.active = 1 GROUP BY v.id ORDER BY v.created_at, v.id`).all()) as unknown as VariantRow[];
    const media = (await this.database.prepare(
      `SELECT product_id, url FROM product_media ORDER BY product_id, position`
    ).all()) as unknown as Array<{ product_id: string; url: string }>;
    return products.map((product) => {
      const productVariants = variants.filter((variant) => variant.product_id === product.id);
      return {
        id: product.id,
        categoryId: product.category_id,
        slug: product.slug,
        nameFr: product.name_fr,
        nameEn: product.name_en,
        descriptionFr: product.description_fr,
        descriptionEn: product.description_en,
        status: product.status,
        images: media.filter((m) => m.product_id === product.id).map((m) => m.url),
        compareAtMinor: productVariants[0]?.compare_at_price_minor ?? null,
        variants: productVariants.map((variant) => ({
          id: variant.id, sku: variant.sku, size: variant.size, color: variant.color,
          priceMinor: variant.price_minor, currency: variant.currency, stock: variant.stock,
        })),
      };
    });
  }

  async findBySlug(slug: string, includeArchived = false): Promise<CatalogProduct | null> {
    return (await this.listProducts({ includeArchived })).find((product) => product.slug === slug) ?? null;
  }

  async archiveProduct(id: string): Promise<void> {
    const result = await this.database.prepare(`UPDATE products SET status = 'archived',
      archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    if (result.changes === 0) throw new DomainError('NOT_FOUND', 'Product not found', 404);
  }

  async setBasePrice(productId: string, priceMinor: number): Promise<void> {
    if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) {
      throw new DomainError('CONFLICT', 'Price must be a non-negative integer');
    }
    const result = await this.database.prepare(`UPDATE product_variants
      SET price_minor = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND active = 1`)
      .run(priceMinor, productId);
    if (result.changes === 0) throw new DomainError('NOT_FOUND', 'Product variants not found', 404);
  }

  async setAggregateStock(productId: string, targetStock: number, actorId: string): Promise<void> {
    if (!Number.isSafeInteger(targetStock) || targetStock < 0) {
      throw new DomainError('CONFLICT', 'Stock must be a non-negative integer');
    }
    const variants = (await this.database.prepare(`SELECT v.id,
      COALESCE(SUM(m.quantity_delta), 0) AS stock
      FROM product_variants v LEFT JOIN inventory_movements m ON m.variant_id = v.id
      WHERE v.product_id = ? AND v.active = 1 GROUP BY v.id ORDER BY v.created_at, v.id`)
      .all(productId)) as unknown as Array<{ id: string; stock: number }>;
    if (variants.length === 0) throw new DomainError('NOT_FOUND', 'Product variants not found', 404);
    const currentTotal = variants.reduce((total, variant) => total + variant.stock, 0);
    const delta = targetStock - currentTotal;
    if (delta !== 0) {
      await this.database.prepare(`INSERT INTO inventory_movements
        (id, variant_id, quantity_delta, reason, actor_id) VALUES (?, ?, ?, 'adjustment', ?)`)
        .run(randomUUID(), variants[0].id, delta, actorId);
    }
  }

  async addVariant(productId: string, input: { sku: string; size: string | null; color: string | null; priceMinor: number; currency: 'EUR' | 'GBP'; stock: number }): Promise<string> {
    const id = randomUUID();
    await this.database.exec('BEGIN IMMEDIATE');
    try {
      await this.database.prepare(`INSERT INTO product_variants
        (id, product_id, sku, size, color, price_minor, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(id, productId, input.sku, input.size, input.color, input.priceMinor, input.currency);
      if (input.stock > 0) {
        await this.database.prepare(`INSERT INTO inventory_movements
          (id, variant_id, quantity_delta, reason) VALUES (?, ?, ?, 'initial')`)
          .run(randomUUID(), id, input.stock);
      }
      await this.database.exec('COMMIT');
    } catch {
      await this.database.exec('ROLLBACK');
      throw new DomainError('CONFLICT', 'Variant SKU already exists');
    }
    return id;
  }

  async deactivateVariant(variantId: string): Promise<void> {
    const result = await this.database.prepare(
      `UPDATE product_variants SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(variantId);
    if (result.changes === 0) throw new DomainError('NOT_FOUND', 'Variant not found', 404);
  }

  async adjustVariantStock(variantId: string, targetStock: number, actorId: string): Promise<void> {
    if (!Number.isSafeInteger(targetStock) || targetStock < 0) {
      throw new DomainError('CONFLICT', 'Stock must be a non-negative integer');
    }
    const exists = await this.database.prepare(`SELECT id FROM product_variants WHERE id = ?`).get(variantId);
    if (!exists) throw new DomainError('NOT_FOUND', 'Variant not found', 404);
    const row = (await this.database.prepare(
      `SELECT COALESCE(SUM(quantity_delta), 0) AS stock FROM inventory_movements WHERE variant_id = ?`
    ).get(variantId)) as { stock: number } | undefined;
    const delta = targetStock - (row?.stock ?? 0);
    if (delta !== 0) {
      await this.database.prepare(`INSERT INTO inventory_movements
        (id, variant_id, quantity_delta, reason, actor_id) VALUES (?, ?, ?, 'adjustment', ?)`)
        .run(randomUUID(), variantId, delta, actorId);
    }
  }

  async adjustInventory(input: { variantId: string; quantityDelta: number; reason: InventoryReason }): Promise<number> {
    if (!Number.isSafeInteger(input.quantityDelta) || input.quantityDelta === 0) {
      throw new DomainError('CONFLICT', 'Inventory adjustment must be a non-zero integer');
    }
    await this.database.exec('BEGIN IMMEDIATE');
    try {
      const row = (await this.database.prepare(`SELECT COALESCE(SUM(quantity_delta), 0) AS stock
        FROM inventory_movements WHERE variant_id = ?`).get(input.variantId)) as { stock: number } | undefined;
      const stockVal = row?.stock ?? 0;
      const nextStock = stockVal + input.quantityDelta;
      if (nextStock < 0) throw new DomainError('CONFLICT', 'Insufficient stock');
      await this.database.prepare(`INSERT INTO inventory_movements
        (id, variant_id, quantity_delta, reason) VALUES (?, ?, ?, ?)`)
        .run(randomUUID(), input.variantId, input.quantityDelta, input.reason);
      await this.database.exec('COMMIT');
      return nextStock;
    } catch (error) {
      await this.database.exec('ROLLBACK');
      if (error instanceof DomainError) throw error;
      throw new DomainError('NOT_FOUND', 'Variant not found', 404);
    }
  }

  async replaceImages(productId: string, urls: string[]): Promise<void> {
    await this.database.exec('BEGIN IMMEDIATE');
    try {
      await this.database.prepare(`DELETE FROM product_media WHERE product_id = ?`).run(productId);
      const insert = this.database.prepare(`INSERT INTO product_media
        (id, product_id, url, position) VALUES (?, ?, ?, ?)`);
      for (let index = 0; index < urls.length; index += 1) {
        await insert.run(randomUUID(), productId, urls[index], index);
      }
      await this.database.exec('COMMIT');
    } catch (error) {
      await this.database.exec('ROLLBACK');
      throw error;
    }
  }

  async setCompareAt(productId: string, compareAtMinor: number | null): Promise<void> {
    await this.database.prepare(
      `UPDATE product_variants SET compare_at_price_minor = ?, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = ? AND active = 1`
    ).run(compareAtMinor, productId);
  }
}
