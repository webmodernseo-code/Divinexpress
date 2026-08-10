import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { CatalogRepository } from '@/server/catalog/repository';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const patchSchema = z.object({
  categoryId: z.string().min(1).optional(),
  nameFr: z.string().trim().min(1).optional(),
  nameEn: z.string().trim().min(1).optional(),
  descriptionFr: z.string().optional(),
  descriptionEn: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  priceMinor: z.number().int().nonnegative().optional(),
  stock: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { id } = await params;
    const body = patchSchema.parse(await request.json());

    const db = await getCommerceDatabase();
    await db.exec('BEGIN IMMEDIATE');

    try {
      // 1. Update product details
      const updates: string[] = [];
      const values: unknown[] = [];

      if (body.categoryId) { updates.push('category_id = ?'); values.push(body.categoryId); }
      if (body.nameFr) { updates.push('name_fr = ?'); values.push(body.nameFr); }
      if (body.nameEn) { updates.push('name_en = ?'); values.push(body.nameEn); }
      if (body.descriptionFr !== undefined) { updates.push('description_fr = ?'); values.push(body.descriptionFr); }
      if (body.descriptionEn !== undefined) { updates.push('description_en = ?'); values.push(body.descriptionEn); }
      if (body.status) { updates.push('status = ?'); values.push(body.status); }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        await db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }

      // 2. Update price and stock of the first/main variant
      if (body.priceMinor !== undefined || body.stock !== undefined) {
        const catalog = new CatalogRepository(db);
        if (body.priceMinor !== undefined) await catalog.setBasePrice(id, body.priceMinor);
        if (body.stock !== undefined) await catalog.setAggregateStock(id, body.stock, admin.id);
      }

      await db.exec('COMMIT');
    } catch (e) {
      await db.exec('ROLLBACK');
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'PRODUCT_UPDATE_FAILED' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { id } = await params;
    const db = await getCommerceDatabase();
    await new CatalogRepository(db).archiveProduct(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    return NextResponse.json({ error: 'PRODUCT_ARCHIVE_FAILED' }, { status: 500 });
  }
}
