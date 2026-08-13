import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { CatalogRepository } from '@/server/catalog/repository';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const schema = z.object({
  stock: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { variantId } = await params;
    const body = schema.parse(await request.json());
    const db = await getCommerceDatabase();
    const repo = new CatalogRepository(db);
    if (body.stock !== undefined) await repo.adjustVariantStock(variantId, body.stock, admin.id);
    if (body.active === false) await repo.deactivateVariant(variantId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'VARIANT_UPDATE_FAILED' }, { status: 500 });
  }
}
