import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';
import { PromotionRepository } from '@/server/promotions/repository';
import { errorResponse, hasActiveProduct } from './helpers';

const imageUrlSchema = z.string().trim().min(1).refine(
  (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
  'Image must be an absolute HTTP(S) URL or a local path',
);

const slideSchema = z.object({
  imageUrl: imageUrlSchema,
  productId: z.string().trim().min(1),
  position: z.number().int().nonnegative(),
  active: z.boolean(),
});

const reorderSchema = z.object({
  ids: z.array(z.string().trim().min(1)).refine(
    (ids) => new Set(ids).size === ids.length,
    'Slide IDs must be unique',
  ),
});

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const database = await getCommerceDatabase();
    return NextResponse.json(await new PromotionRepository(database).listAdmin());
  } catch (error) {
    return errorResponse(error, 'PROMOTION_LIST_FAILED');
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager']);
    const input = slideSchema.parse(await request.json());
    const database = await getCommerceDatabase();
    if (!await hasActiveProduct(database, input.productId)) {
      return NextResponse.json({ error: 'INVALID_PROMOTION' }, { status: 400 });
    }

    const slide = await new PromotionRepository(database).create(input);
    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'PROMOTION_CREATE_FAILED');
  }
}

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { ids } = reorderSchema.parse(await request.json());
    const database = await getCommerceDatabase();
    await new PromotionRepository(database).reorder(ids);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'PROMOTION_REORDER_FAILED');
  }
}
