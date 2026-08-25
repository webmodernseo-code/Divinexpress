import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

export async function hasActiveProduct(
  database: Awaited<ReturnType<typeof getCommerceDatabase>>,
  productId: string,
): Promise<boolean> {
  return Boolean(await database
    .prepare("SELECT 1 FROM products WHERE id = ? AND status = 'active'")
    .get(productId));
}

export function errorResponse(error: unknown, fallback: string): NextResponse {
  if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
  if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_PROMOTION' }, { status: 400 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}
