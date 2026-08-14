import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { CatalogRepository } from '@/server/catalog/repository';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const inputSchema = z.object({
  categoryId: z.string().min(1), slug: z.string().min(1), nameFr: z.string().min(1),
  nameEn: z.string().min(1), descriptionFr: z.string(), descriptionEn: z.string(),
  images: z.array(z.string().url()).max(6).optional(),
  compareAtPriceMinor: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'active']).optional(),
  brand: z.string().trim().min(1).max(120).nullable().optional(),
  variants: z.array(z.object({
    sku: z.string().min(1), size: z.string().nullable(), color: z.string().nullable(),
    priceMinor: z.number().int().nonnegative(), currency: z.enum(['EUR', 'GBP']),
    stock: z.number().int().nonnegative().default(0),
  })).min(1),
});

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const db = await getCommerceDatabase();
  return NextResponse.json(await new CatalogRepository(db).listProducts({ includeArchived: true }));
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager']);
    const input = inputSchema.parse(await request.json());
    const db = await getCommerceDatabase();
    const product = await new CatalogRepository(db).createProduct({
      id: randomUUID(), ...input,
      variants: input.variants.map((variant) => ({ id: randomUUID(), ...variant })),
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_PRODUCT' }, { status: 400 });
    return NextResponse.json({ error: 'PRODUCT_CREATE_FAILED' }, { status: 500 });
  }
}
