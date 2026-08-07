import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SlidingWindowRateLimiter } from '@/server/auth/rate-limit';
import { getCommerceDatabase } from '@/server/db/runtime';
import type { Database } from '@/server/db/client';
import { DomainError } from '@/server/domain/errors';
import { addMessage, resolveCustomerId, upsertConversation } from '@/server/messaging/repository';
import { generateAgentReply } from '@/server/ai/agent';

const limiter = new SlidingWindowRateLimiter(5, 60 * 60 * 1_000);
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  message: z.string().trim().min(10).max(5_000),
});

interface CustomerRow {
  first_name: string;
  last_name: string;
  email: string | null;
}
interface OrderRow {
  number: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
}

async function loadContext(db: Database, email: string) {
  const id = await resolveCustomerId(db, 'email', email);
  if (!id) return { customer: null, order: null };
  const customer =
    ((await db
      .prepare('SELECT first_name, last_name, email FROM customers WHERE id = ?')
      .get(id)) as CustomerRow | undefined) ?? null;
  const order =
    ((await db
      .prepare(
        `SELECT o.number, o.status, s.carrier, s.tracking_number
         FROM orders o LEFT JOIN shipments s ON s.order_id = o.id
         WHERE o.customer_id = ? ORDER BY o.created_at DESC LIMIT 1`,
      )
      .get(id)) as OrderRow | undefined) ?? null;
  return { customer, order };
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.trim().toLowerCase();
    limiter.consume(email);

    const db = await getCommerceDatabase();

    const conversation = await upsertConversation(db, {
      channel: 'email',
      externalId: email,
      displayName: input.name,
    });
    await addMessage(db, {
      conversationId: conversation.id,
      direction: 'inbound',
      author: 'customer',
      body: input.message,
    });

    // Produce an AI-suggested reply the admin can review/edit before sending.
    // Stored as a draft — it is NOT delivered to the customer (no email channel).
    const { customer, order } = await loadContext(db, email);
    const { text } = await generateAgentReply({
      channel: 'email',
      displayName: input.name,
      customer: customer
        ? { firstName: customer.first_name, lastName: customer.last_name, email: customer.email }
        : null,
      order: order
        ? {
            number: order.number,
            status: order.status,
            carrier: order.carrier,
            trackingNumber: order.tracking_number,
          }
        : null,
      message: input.message,
    });
    await addMessage(db, {
      conversationId: conversation.id,
      direction: 'outbound',
      author: 'ai',
      body: text,
      status: 'draft',
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_MESSAGE' }, { status: 400 });
    console.error('[contact] error:', error);
    return NextResponse.json({ error: 'MESSAGE_CREATE_FAILED' }, { status: 500 });
  }
}
