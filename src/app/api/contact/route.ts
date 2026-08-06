import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SlidingWindowRateLimiter } from '@/server/auth/rate-limit';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';

const limiter = new SlidingWindowRateLimiter(5, 60 * 60 * 1_000);
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  message: z.string().trim().min(10).max(5_000),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.trim().toLowerCase();
    limiter.consume(email);
    const db = await getCommerceDatabase();
    await db.prepare(`INSERT INTO contact_messages
      (id, email, name, subject, body) VALUES (?, ?, ?, ?, ?)`)
      .run(randomUUID(), email, input.name, 'Storefront contact', input.message);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_MESSAGE' }, { status: 400 });
    return NextResponse.json({ error: 'MESSAGE_CREATE_FAILED' }, { status: 500 });
  }
}
