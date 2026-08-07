import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';
import {
  addMessage,
  getConversationById,
  getThread,
  listConversationSummaries,
  markRead,
  setAiEnabled,
  setStatus,
} from '@/server/messaging/repository';
import { sendWhatsAppText } from '@/server/messaging/whatsapp';

function formatTime(ts: string | null): string {
  if (!ts) return '';
  // SQLite stores "YYYY-MM-DD HH:MM:SS" in UTC without a zone marker; normalize.
  const normalized = ts.includes('T') || ts.endsWith('Z') ? ts : `${ts.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export async function GET() {
  if (!(await getCurrentAdmin())) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const db = await getCommerceDatabase();
  const conversations = await listConversationSummaries(db);

  const result = await Promise.all(
    conversations.map(async (c) => {
      const thread = await getThread(db, c.id);
      const displayName = c.display_name || c.customer_email || c.external_id;
      return {
        id: c.id,
        conversationId: c.id,
        channel: c.channel,
        customerName: displayName,
        phone: c.channel === 'whatsapp' ? c.external_id : c.customer_phone ?? '',
        email: c.channel === 'whatsapp' ? c.customer_email ?? '' : c.external_id,
        avatar: initials(displayName),
        unread: c.unread_count,
        lastMsg: c.last_message_preview,
        lastTime: formatTime(c.last_message_at),
        status: c.status === 'resolved' ? 'resolved' : 'pending',
        aiEnabled: c.ai_enabled === 1,
        ordersCount: c.orders_count,
        totalSpent: `${(c.total_spent_minor / 100).toFixed(2).replace('.', ',')} €`,
        returnCount: c.return_count,
        history: thread.map((m) => ({
          id: m.id,
          sender: m.author === 'customer' ? 'client' : m.author === 'system' ? 'system' : 'admin',
          author: m.author,
          text: m.body,
          time: formatTime(m.created_at),
          isRead: m.direction === 'outbound',
        })),
      };
    }),
  );

  return NextResponse.json(result);
}

const postSchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().min(1),
});

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager', 'support']);
    const body = postSchema.parse(await request.json());
    const db = await getCommerceDatabase();

    const conversation = await getConversationById(db, body.conversationId);
    if (!conversation) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    // A human reply pauses the AI on this conversation (human takeover).
    await setAiEnabled(db, conversation.id, false);
    await addMessage(db, {
      conversationId: conversation.id,
      direction: 'outbound',
      author: 'admin',
      adminId: admin.id,
      body: body.text,
    });

    if (conversation.channel === 'whatsapp') {
      await sendWhatsAppText(conversation.external_id, body.text);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    console.error('[admin-messages] reply error:', error);
    return NextResponse.json({ error: 'REPLY_FAILED' }, { status: 500 });
  }
}

const patchSchema = z.object({
  conversationId: z.string().min(1),
  status: z.enum(['open', 'pending', 'resolved']).optional(),
  aiEnabled: z.boolean().optional(),
  markRead: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager', 'support']);
    const body = patchSchema.parse(await request.json());
    const db = await getCommerceDatabase();

    if (body.status) await setStatus(db, body.conversationId, body.status);
    if (typeof body.aiEnabled === 'boolean') await setAiEnabled(db, body.conversationId, body.aiEnabled);
    if (body.markRead) await markRead(db, body.conversationId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
  }
}
