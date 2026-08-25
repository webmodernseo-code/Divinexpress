import { randomUUID } from 'node:crypto';
import type { Database } from '../db/client';
import { DomainError } from '../domain/errors';

export interface PromotionSlide {
  id: string;
  imageUrl: string;
  productId: string;
  productSlug: string;
  productNameFr: string;
  productNameEn: string;
  position: number;
  active: boolean;
}

export interface PromotionSlideInput {
  imageUrl: string;
  productId: string;
  position: number;
  active?: boolean;
}

export type PromotionSlideUpdate = Partial<PromotionSlideInput>;

interface PromotionSlideRow {
  id: string;
  image_url: string;
  product_id: string;
  product_slug: string;
  product_name_fr: string;
  product_name_en: string;
  position: number;
  active: number;
}

function toPromotionSlide(row: PromotionSlideRow): PromotionSlide {
  return {
    id: row.id,
    imageUrl: row.image_url,
    productId: row.product_id,
    productSlug: row.product_slug,
    productNameFr: row.product_name_fr,
    productNameEn: row.product_name_en,
    position: row.position,
    active: row.active === 1,
  };
}

export class PromotionRepository {
  constructor(private readonly database: Database) {}

  async listPublished(): Promise<PromotionSlide[]> {
    return this.list('WHERE s.active = 1 AND p.status = \'active\'');
  }

  async listAdmin(): Promise<PromotionSlide[]> {
    return this.list('');
  }

  async create(input: PromotionSlideInput): Promise<PromotionSlide> {
    const id = randomUUID();
    await this.database.prepare(`INSERT INTO promotion_slides
      (id, image_url, product_id, position, active) VALUES (?, ?, ?, ?, ?)`)
      .run(id, input.imageUrl, input.productId, input.position, input.active === false ? 0 : 1);
    return this.requireById(id);
  }

  async update(id: string, input: PromotionSlideUpdate): Promise<PromotionSlide> {
    const result = await this.database.prepare(`UPDATE promotion_slides
      SET image_url = COALESCE(?, image_url),
          product_id = COALESCE(?, product_id),
          position = COALESCE(?, position),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`)
      .run(
        input.imageUrl ?? null,
        input.productId ?? null,
        input.position ?? null,
        input.active === undefined ? null : input.active ? 1 : 0,
        id,
      );
    if (result.changes === 0) throw new DomainError('NOT_FOUND', 'Promotion slide not found', 404);
    return this.requireById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.database.prepare('DELETE FROM promotion_slides WHERE id = ?').run(id);
    if (result.changes === 0) throw new DomainError('NOT_FOUND', 'Promotion slide not found', 404);
  }

  async reorder(ids: string[]): Promise<void> {
    await this.database.exec('BEGIN IMMEDIATE');
    try {
      const updatePosition = this.database.prepare(`UPDATE promotion_slides
        SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
      for (let position = 0; position < ids.length; position += 1) {
        const result = await updatePosition.run(position, ids[position]);
        if (result.changes === 0) throw new DomainError('NOT_FOUND', 'Promotion slide not found', 404);
      }
      await this.database.exec('COMMIT');
    } catch (error) {
      await this.database.exec('ROLLBACK');
      throw error;
    }
  }

  private async list(whereClause: string): Promise<PromotionSlide[]> {
    const rows = (await this.database.prepare(`SELECT s.id, s.image_url, s.product_id,
      p.slug AS product_slug, p.name_fr AS product_name_fr, p.name_en AS product_name_en,
      s.position, s.active
      FROM promotion_slides s JOIN products p ON p.id = s.product_id
      ${whereClause}
      ORDER BY s.position ASC, s.id ASC`).all()) as unknown as PromotionSlideRow[];
    return rows.map(toPromotionSlide);
  }

  private async requireById(id: string): Promise<PromotionSlide> {
    const row = (await this.database.prepare(`SELECT s.id, s.image_url, s.product_id,
      p.slug AS product_slug, p.name_fr AS product_name_fr, p.name_en AS product_name_en,
      s.position, s.active
      FROM promotion_slides s JOIN products p ON p.id = s.product_id
      WHERE s.id = ?`).get(id)) as PromotionSlideRow | undefined;
    if (!row) throw new DomainError('NOT_FOUND', 'Promotion slide not found', 404);
    return toPromotionSlide(row);
  }
}
