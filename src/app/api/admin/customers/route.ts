import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { getCommerceDatabase } from '@/server/db/runtime';

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const db = await getCommerceDatabase();
  const rows = await db.prepare(`SELECT c.id, c.email, c.first_name AS firstName,
    c.last_name AS lastName, c.phone, c.created_at AS createdAt,
    COUNT(o.id) AS orderCount, COALESCE(SUM(o.total_minor), 0) AS totalSpentMinor
    FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
    WHERE c.deleted_at IS NULL GROUP BY c.id ORDER BY c.created_at DESC LIMIT 250`).all();
  return NextResponse.json(rows);
}
