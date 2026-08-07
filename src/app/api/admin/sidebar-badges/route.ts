import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { getCommerceDatabase } from '@/server/db/runtime';
import { countUnreadConversations } from '@/server/messaging/repository';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const db = await getCommerceDatabase();

    // Active orders (pending_payment, paid, preparing)
    const ordersCountRow = (await db.prepare(
      `SELECT COUNT(*) as count FROM orders WHERE status IN ('pending_payment', 'paid', 'preparing')`
    ).get()) as { count: number } | undefined;
    const ordersCount = ordersCountRow?.count ?? 0;

    // Returns count (requested)
    const returnsCountRow = (await db.prepare(
      `SELECT COUNT(*) as count FROM returns WHERE status = 'requested'`
    ).get()) as { count: number } | undefined;
    const returnsCount = returnsCountRow?.count ?? 0;

    // Messages count = conversations with unread customer messages
    const messagesCount = await countUnreadConversations(db);

    return NextResponse.json({
      orders: ordersCount,
      returns: returnsCount,
      messages: messagesCount,
    });
  } catch {
    return NextResponse.json({ error: 'FAILED_TO_FETCH_BADGES' }, { status: 500 });
  }
}
