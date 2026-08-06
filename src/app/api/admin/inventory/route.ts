import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { CatalogRepository } from '@/server/catalog/repository';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const schema = z.object({
  variantId: z.string().min(1), quantityDelta: z.number().int().refine((value) => value !== 0),
  reason: z.enum(['adjustment', 'return']),
});

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const input = schema.parse(await request.json());
    const db = await getCommerceDatabase();
    const stock = await new CatalogRepository(db).adjustInventory(input);
    return NextResponse.json({ stock });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_ADJUSTMENT' }, { status: 400 });
    return NextResponse.json({ error: 'INVENTORY_UPDATE_FAILED' }, { status: 500 });
  }
}
