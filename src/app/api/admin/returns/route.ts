import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';

const createSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    requireRole(admin.role, ['owner', 'manager', 'support']);
    const body = createSchema.parse(await request.json());
    const db = await getCommerceDatabase();
    const order = (await db.prepare(`SELECT id FROM orders WHERE id = ? OR number = ?`)
      .get(body.orderId, body.orderId)) as { id: string } | undefined;
    if (!order) return NextResponse.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    const id = randomUUID();
    await db.prepare(`INSERT INTO returns (id, order_id, status, reason) VALUES (?, ?, 'requested', ?)`)
      .run(id, order.id, body.reason);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'RETURN_CREATE_FAILED' }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['requested', 'approved', 'rejected', 'received', 'refunded', 'pending', 'accepted', 'refused']),
});

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  const db = await getCommerceDatabase();

  interface DbReturnRow {
    id: string;
    orderId: string;
    status: string;
    reason: string;
    createdAt: string;
    orderNumber: string;
    firstName: string | null;
    lastName: string | null;
  }

  const rows = (await db.prepare(`SELECT r.id, r.order_id AS orderId, r.status, r.reason, r.created_at AS createdAt,
    o.number AS orderNumber, c.first_name AS firstName, c.last_name AS lastName
    FROM returns r
    JOIN orders o ON o.id = r.order_id
    LEFT JOIN customers c ON c.id = o.customer_id
    ORDER BY r.created_at DESC`).all()) as DbReturnRow[];
    
  return NextResponse.json(rows.map(row => ({
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    customer: [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Client invité',
    reason: row.reason,
    status: row.status, // requested, approved, rejected, received, refunded
    createdAt: row.createdAt,
  })));
}

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  try {
    requireRole(admin.role, ['owner', 'manager', 'support']);
    const body = patchSchema.parse(await request.json());
    
    // Map frontend status values to DB schema statuses
    let dbStatus = body.status;
    if (dbStatus === 'pending') dbStatus = 'requested';
    if (dbStatus === 'accepted') dbStatus = 'approved';
    if (dbStatus === 'refused') dbStatus = 'rejected';
    
    const db = await getCommerceDatabase();
    await db.prepare(`UPDATE returns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(dbStatus, body.id);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'RETURN_UPDATE_FAILED' }, { status: 500 });
  }
}
