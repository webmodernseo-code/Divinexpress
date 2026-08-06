import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['requested', 'approved', 'rejected', 'received', 'refunded', 'pending', 'accepted', 'refused']),
});

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  const db = await getCommerceDatabase();
  
  // Let's check if the returns table is completely empty, and if so, seed a few demo returns for visualization
  const count = (await db.prepare('SELECT COUNT(*) as c FROM returns').get() as { c: number }).c;
  if (count === 0) {
    // Let's see if we have any orders to link them to, otherwise let's insert dummy orders and returns
    const ordersCount = (await db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
    if (ordersCount === 0) {
      await db.exec('BEGIN IMMEDIATE');
      try {
        // Insert dummy customer
        const custId = 'demo-cust-returns-1';
        await db.prepare(`INSERT OR IGNORE INTO customers (id, email, first_name, last_name, phone)
          VALUES (?, 'pierre.leroux@email.com', 'Pierre', 'Leroux', '+33 6 12 34 56 78')`).run(custId);
        
        // Insert dummy orders
        await db.prepare(`INSERT OR IGNORE INTO orders (id, number, customer_id, idempotency_key, status, currency, subtotal_minor, shipping_minor, tax_minor, discount_minor, total_minor, shipping_address_json, created_at, updated_at)
          VALUES ('order-ret-1', '#1081', ?, 'key-ret-1', 'refunded', 'EUR', 27200, 0, 0, 0, 27200, '{}', datetime('now', '-2 days'), datetime('now', '-2 days'))`).run(custId);
        await db.prepare(`INSERT OR IGNORE INTO orders (id, number, customer_id, idempotency_key, status, currency, subtotal_minor, shipping_minor, tax_minor, discount_minor, total_minor, shipping_address_json, created_at, updated_at)
          VALUES ('order-ret-2', '#1083', ?, 'key-ret-2', 'preparing', 'EUR', 8990, 0, 0, 0, 8990, '{}', datetime('now', '-1 day'), datetime('now', '-1 day'))`).run(custId);
        await db.prepare(`INSERT OR IGNORE INTO orders (id, number, customer_id, idempotency_key, status, currency, subtotal_minor, shipping_minor, tax_minor, discount_minor, total_minor, shipping_address_json, created_at, updated_at)
          VALUES ('order-ret-3', '#1080', ?, 'key-ret-3', 'preparing', 'EUR', 16250, 0, 0, 0, 16250, '{}', datetime('now', '-5 days'), datetime('now', '-5 days'))`).run(custId);
          
        // Insert returns
        await db.prepare(`INSERT OR IGNORE INTO returns (id, order_id, status, reason, created_at)
          VALUES ('RET-001', 'order-ret-1', 'refunded', 'Taille trop petite', datetime('now', '-1 hour'))`).run();
        await db.prepare(`INSERT OR IGNORE INTO returns (id, order_id, status, reason, created_at)
          VALUES ('RET-002', 'order-ret-2', 'requested', 'Changement d''avis', datetime('now', '-3 hours'))`).run();
        await db.prepare(`INSERT OR IGNORE INTO returns (id, order_id, status, reason, created_at)
          VALUES ('RET-003', 'order-ret-3', 'approved', 'Article défectueux', datetime('now', '-3 days'))`).run();
        await db.exec('COMMIT');
      } catch {
        await db.exec('ROLLBACK');
      }
    }
  }

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
