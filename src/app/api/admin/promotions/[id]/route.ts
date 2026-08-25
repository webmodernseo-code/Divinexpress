import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';
import { PromotionRepository } from '@/server/promotions/repository';
import { errorResponse, hasActiveProduct } from '../helpers';

const imageUrlSchema = z.string().trim().min(1).refine(
  (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
  'Image must be an absolute HTTP(S) URL or a local path',
);

const updateSchema = z.object({
  imageUrl: imageUrlSchema.optional(),
  productId: z.string().trim().min(1).optional(),
  position: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
}).refine((input) => Object.values(input).some((value) => value !== undefined), 'At least one field is required');

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager']);
    const input = updateSchema.parse(await request.json());
    const { id } = await params;
    const database = await getCommerceDatabase();
    if (input.productId && !await hasActiveProduct(database, input.productId)) {
      return NextResponse.json({ error: 'INVALID_PROMOTION' }, { status: 400 });
    }

    const slide = await new PromotionRepository(database).update(id, input);
    return NextResponse.json(slide);
  } catch (error) {
    return errorResponse(error, 'PROMOTION_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { id } = await params;
    const database = await getCommerceDatabase();
    await new PromotionRepository(database).delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error, 'PROMOTION_DELETE_FAILED');
  }
}
