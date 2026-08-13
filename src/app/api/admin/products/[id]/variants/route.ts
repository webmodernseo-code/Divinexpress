import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { CatalogRepository } from '@/server/catalog/repository';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const schema = z.object({
  size: z.string().trim().min(1).nullable(),
  color: z.string().trim().min(1).nullable(),
  stock: z.number().int().nonnegative().default(0),
  priceMinor: z.number().int().nonnegative().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const { id } = await params;
    const body = schema.parse(await request.json());
    const db = await getCommerceDatabase();
    const repo = new CatalogRepository(db);
    const existing = (await repo.listProducts({ includeArchived: true })).find((p) => p.id === id);
    if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    const priceMinor = body.priceMinor ?? existing.variants[0]?.priceMinor ?? 0;
    const sku = `DIVINEXPRESS-${existing.slug.toUpperCase()}-${randomUUID().slice(0, 8)}`;
    const variantId = await repo.addVariant(id, {
      sku, size: body.size, color: body.color, priceMinor, currency: 'EUR', stock: body.stock,
    });
    return NextResponse.json({ id: variantId }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'VARIANT_CREATE_FAILED' }, { status: 500 });
  }
}
