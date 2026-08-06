import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { getCommerceDatabase } from '@/server/db/runtime';

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const db = await getCommerceDatabase();
  const rows = await db.prepare(`SELECT o.id, o.number, o.status, o.currency,
    o.total_minor AS totalMinor, o.created_at AS createdAt, c.first_name AS firstName,
    c.last_name AS lastName, c.email FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id ORDER BY o.created_at DESC LIMIT 250`).all();
  return NextResponse.json(rows);
}
