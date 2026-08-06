import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';

const postSchema = z.object({
  email: z.string().email(),
  text: z.string().min(1),
});

const patchSchema = z.object({
  email: z.string().email(),
  status: z.enum(['new', 'open', 'closed', 'resolved', 'pending']),
});

export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  const db = await getCommerceDatabase();
  
  // Seed demo contact messages if empty
  const count = (await db.prepare('SELECT COUNT(*) as c FROM contact_messages').get() as { c: number }).c;
  if (count === 0) {
    await db.exec('BEGIN IMMEDIATE');
    try {
      await db.prepare(`INSERT OR IGNORE INTO contact_messages (id, email, name, subject, body, status, created_at)
        VALUES (?, 'alice.martin@email.com', 'Alice Martin', 'Storefront contact', 'Bonjour, où en est ma commande ?', 'open', datetime('now', '-20 minutes'))`)
        .run(randomUUID());
      await db.prepare(`INSERT OR IGNORE INTO contact_messages (id, email, name, subject, body, status, created_at)
        VALUES (?, 'alice.martin@email.com', 'Admin', 'Reply from Admin', 'Bonjour Alice, votre commande a été expédiée ce matin.', 'open', datetime('now', '-15 minutes'))`)
        .run(randomUUID());
      await db.prepare(`INSERT OR IGNORE INTO contact_messages (id, email, name, subject, body, status, created_at)
        VALUES (?, 'alice.martin@email.com', 'Alice Martin', 'Storefront contact', 'Merci ! Puis-je avoir le numéro de suivi ?', 'open', datetime('now', '-10 minutes'))`)
        .run(randomUUID());
      await db.prepare(`INSERT OR IGNORE INTO contact_messages (id, email, name, subject, body, status, created_at)
        VALUES (?, 'lucas.bernard@email.com', 'Lucas Bernard', 'Storefront contact', 'Bonjour, je souhaite modifier mon adresse de livraison s''il vous plaît.', 'new', datetime('now', '-1 hour'))`)
        .run(randomUUID());
      await db.exec('COMMIT');
    } catch {
      await db.exec('ROLLBACK');
    }
  }

  interface ContactMessageRow {
    id: string;
    email: string;
    name: string;
    subject: string;
    body: string;
    status: string;
    created_at: string;
  }

  interface ChatHistoryItem {
    id: string;
    sender: 'admin' | 'client';
    text: string;
    time: string;
    isRead: boolean;
  }

  interface ChatGroup {
    id: string;
    customerName: string;
    phone: string;
    email: string;
    avatar: string;
    unread: number;
    lastMsg: string;
    lastTime: string;
    status: 'pending' | 'resolved';
    ordersCount: number;
    totalSpent: string;
    returnCount: number;
    history: ChatHistoryItem[];
  }

  // Fetch all messages
  const messages = (await db.prepare(`SELECT id, email, name, subject, body, status, created_at
    FROM contact_messages ORDER BY created_at ASC`).all()) as ContactMessageRow[];
    
  // Group by email
  const chatGroups: Record<string, ChatGroup> = {};
  
  for (const msg of messages) {
    const email = msg.email;
    if (!chatGroups[email]) {
      // Find customer info
      const customer = (await db.prepare(`SELECT first_name, last_name, phone FROM customers WHERE email = ? LIMIT 1`)
        .get(email)) as { first_name: string; last_name: string; phone: string | null } | undefined;
      const stats = (await db.prepare(`SELECT COUNT(id) as c, COALESCE(SUM(total_minor), 0) as total FROM orders WHERE customer_id = (SELECT id FROM customers WHERE email = ? LIMIT 1)`)
        .get(email)) as { c: number; total: number } | undefined;
      const returnStats = (await db.prepare(`SELECT COUNT(r.id) as c FROM returns r JOIN orders o ON o.id = r.order_id WHERE o.customer_id = (SELECT id FROM customers WHERE email = ? LIMIT 1)`)
        .get(email)) as { c: number } | undefined;
      
      const ordersCount = stats?.c ?? 0;
      const totalSpent = (stats?.total ?? 0) / 100;
      
      chatGroups[email] = {
        id: email,
        customerName: customer ? `${customer.first_name} ${customer.last_name}` : msg.name,
        phone: customer?.phone ?? '',
        email: email,
        avatar: (customer ? `${customer.first_name[0]}${customer.last_name[0]}` : msg.name.slice(0, 2)).toUpperCase(),
        unread: 0,
        lastMsg: '',
        lastTime: '',
        status: msg.status === 'closed' ? 'resolved' : 'pending',
        ordersCount,
        totalSpent: `${totalSpent.toFixed(2).replace('.', ',')} €`,
        returnCount: returnStats?.c ?? 0,
        history: [],
      };
    }
    
    const isReply = msg.subject === 'Reply from Admin';
    const msgTime = new Date(msg.created_at + 'Z').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    chatGroups[email].history.push({
      id: msg.id,
      sender: isReply ? 'admin' : 'client',
      text: msg.body,
      time: msgTime,
      isRead: isReply ? true : false,
    });
    
    chatGroups[email].lastMsg = msg.body;
    chatGroups[email].lastTime = msgTime;
    
    if (msg.status === 'new' && !isReply) {
      chatGroups[email].unread += 1;
    }
    if (msg.status === 'closed') {
      chatGroups[email].status = 'resolved';
    } else {
      chatGroups[email].status = 'pending';
    }
  }
  
  return NextResponse.json(Object.values(chatGroups));
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  try {
    requireRole(admin.role, ['owner', 'manager', 'support']);
    const body = postSchema.parse(await request.json());
    
    const db = await getCommerceDatabase();
    await db.prepare(`INSERT INTO contact_messages (id, email, name, subject, body, status)
      VALUES (?, ?, ?, 'Reply from Admin', ?, 'open')`)
      .run(randomUUID(), body.email, admin.email, body.text);
      
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'REPLY_SEND_FAILED' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  
  try {
    requireRole(admin.role, ['owner', 'manager', 'support']);
    const body = patchSchema.parse(await request.json());
    
    let dbStatus = 'open';
    if (body.status === 'closed' || body.status === 'resolved') dbStatus = 'closed';
    if (body.status === 'new') dbStatus = 'new';
    
    const db = await getCommerceDatabase();
    await db.prepare(`UPDATE contact_messages SET status = ? WHERE email = ?`).run(dbStatus, body.email);
    
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'CHAT_UPDATE_FAILED' }, { status: 500 });
  }
}
