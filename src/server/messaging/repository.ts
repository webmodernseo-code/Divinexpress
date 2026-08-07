import { randomUUID } from 'node:crypto';
import type { Database } from '../db/client';

export type ConversationChannel = 'whatsapp' | 'email' | 'web';
export type ConversationStatus = 'open' | 'pending' | 'resolved';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageAuthor = 'customer' | 'ai' | 'admin' | 'system';
export type MessageStatus = 'received' | 'draft' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ConversationRow {
  id: string;
  channel: ConversationChannel;
  external_id: string;
  customer_id: string | null;
  display_name: string;
  status: ConversationStatus;
  ai_enabled: number;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  author: MessageAuthor;
  admin_id: string | null;
  body: string;
  wa_message_id: string | null;
  status: MessageStatus;
  created_at: string;
}

/** Digits-only representation of a phone number, e.g. "+33 6 12" -> "33612". */
export function phoneDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

/** Loose suffix used to reconcile stored phone numbers with WhatsApp `from` ids. */
export function phoneSuffix(raw: string, length = 9): string {
  return phoneDigits(raw).slice(-length);
}

// Strips common phone separators so a stored "+33 6 12 34 56 78" compares to raw digits.
// Portable across SQLite and PostgreSQL (both support nested REPLACE()).
const NORMALIZED_PHONE_SQL =
  "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '+', ''), '-', ''), '.', ''), '(', ''), ')', '')";

/** Resolves a customer id from a conversation external id (phone or email). */
export async function resolveCustomerId(
  db: Database,
  channel: ConversationChannel,
  externalId: string,
): Promise<string | null> {
  if (channel === 'whatsapp') {
    const suffix = `%${phoneSuffix(externalId)}`;
    const row = (await db
      .prepare(
        `SELECT id FROM customers WHERE phone IS NOT NULL AND deleted_at IS NULL AND ${NORMALIZED_PHONE_SQL} LIKE ? LIMIT 1`,
      )
      .get(suffix)) as { id: string } | undefined;
    return row?.id ?? null;
  }
  const row = (await db
    .prepare('SELECT id FROM customers WHERE email = ? AND deleted_at IS NULL LIMIT 1')
    .get(externalId)) as { id: string } | undefined;
  return row?.id ?? null;
}

export interface UpsertConversationInput {
  channel: ConversationChannel;
  externalId: string;
  displayName?: string;
  customerId?: string | null;
}

/** Creates or fetches a conversation keyed by (channel, external_id). */
export async function upsertConversation(
  db: Database,
  input: UpsertConversationInput,
): Promise<ConversationRow> {
  const existing = (await db
    .prepare('SELECT * FROM conversations WHERE channel = ? AND external_id = ? LIMIT 1')
    .get(input.channel, input.externalId)) as ConversationRow | undefined;

  const customerId =
    input.customerId ?? (await resolveCustomerId(db, input.channel, input.externalId));

  if (existing) {
    // Keep human-controlled fields (status, ai_enabled); refresh display name/customer link.
    if (
      (input.displayName && input.displayName !== existing.display_name) ||
      (customerId && customerId !== existing.customer_id)
    ) {
      await db
        .prepare(
          `UPDATE conversations SET display_name = ?, customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
        .run(input.displayName || existing.display_name, customerId ?? existing.customer_id, existing.id);
    }
    return (await db.prepare('SELECT * FROM conversations WHERE id = ?').get(existing.id)) as ConversationRow;
  }

  const id = randomUUID();
  await db
    .prepare(
      `INSERT INTO conversations (id, channel, external_id, customer_id, display_name)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, input.channel, input.externalId, customerId, input.displayName ?? '');
  return (await db.prepare('SELECT * FROM conversations WHERE id = ?').get(id)) as ConversationRow;
}

export interface AddMessageInput {
  conversationId: string;
  direction: MessageDirection;
  author: MessageAuthor;
  body: string;
  adminId?: string | null;
  waMessageId?: string | null;
  status?: MessageStatus;
}

/**
 * Inserts a message and updates the parent conversation.
 * Deduplicates on `waMessageId`; returns null when the message already exists.
 */
export async function addMessage(db: Database, input: AddMessageInput): Promise<MessageRow | null> {
  if (input.waMessageId) {
    const dup = (await db
      .prepare('SELECT id FROM messages WHERE wa_message_id = ? LIMIT 1')
      .get(input.waMessageId)) as { id: string } | undefined;
    if (dup) return null;
  }

  const id = randomUUID();
  const status: MessageStatus = input.status ?? (input.direction === 'inbound' ? 'received' : 'sent');
  await db
    .prepare(
      `INSERT INTO messages (id, conversation_id, direction, author, admin_id, body, wa_message_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.conversationId,
      input.direction,
      input.author,
      input.adminId ?? null,
      input.body,
      input.waMessageId ?? null,
      status,
    );

  const preview = input.body.length > 140 ? `${input.body.slice(0, 140)}…` : input.body;
  const unreadDelta = input.direction === 'inbound' && input.author === 'customer' ? 1 : 0;
  await db
    .prepare(
      `UPDATE conversations
       SET last_message_at = CURRENT_TIMESTAMP,
           last_message_preview = ?,
           unread_count = unread_count + ?,
           status = CASE WHEN ? = 1 AND status = 'resolved' THEN 'pending' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .run(preview, unreadDelta, unreadDelta, input.conversationId);

  return (await db.prepare('SELECT * FROM messages WHERE id = ?').get(id)) as MessageRow;
}

export async function getConversationById(
  db: Database,
  id: string,
): Promise<ConversationRow | undefined> {
  return (await db.prepare('SELECT * FROM conversations WHERE id = ?').get(id)) as
    | ConversationRow
    | undefined;
}

export async function getThread(db: Database, conversationId: string): Promise<MessageRow[]> {
  return (await db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC')
    .all(conversationId)) as MessageRow[];
}

export async function setAiEnabled(
  db: Database,
  conversationId: string,
  enabled: boolean,
): Promise<void> {
  await db
    .prepare('UPDATE conversations SET ai_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(enabled ? 1 : 0, conversationId);
}

export async function setStatus(
  db: Database,
  conversationId: string,
  status: ConversationStatus,
): Promise<void> {
  await db
    .prepare('UPDATE conversations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, conversationId);
}

export async function markRead(db: Database, conversationId: string): Promise<void> {
  await db
    .prepare('UPDATE conversations SET unread_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(conversationId);
}

export async function countUnreadConversations(db: Database): Promise<number> {
  const row = (await db
    .prepare(`SELECT COUNT(*) AS count FROM conversations WHERE unread_count > 0`)
    .get()) as { count: number } | undefined;
  return row?.count ?? 0;
}

export interface ConversationSummary extends ConversationRow {
  orders_count: number;
  total_spent_minor: number;
  return_count: number;
  customer_phone: string | null;
  customer_email: string | null;
}

export async function listConversationSummaries(db: Database): Promise<ConversationSummary[]> {
  return (await db
    .prepare(
      `SELECT c.*,
        cust.phone AS customer_phone,
        cust.email AS customer_email,
        COALESCE(o.orders_count, 0) AS orders_count,
        COALESCE(o.total_spent_minor, 0) AS total_spent_minor,
        COALESCE(r.return_count, 0) AS return_count
       FROM conversations c
       LEFT JOIN customers cust ON cust.id = c.customer_id
       LEFT JOIN (
         SELECT customer_id, COUNT(*) AS orders_count, SUM(total_minor) AS total_spent_minor
         FROM orders GROUP BY customer_id
       ) o ON o.customer_id = c.customer_id
       LEFT JOIN (
         SELECT ord.customer_id, COUNT(ret.id) AS return_count
         FROM returns ret JOIN orders ord ON ord.id = ret.order_id
         GROUP BY ord.customer_id
       ) r ON r.customer_id = c.customer_id
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
    )
    .all()) as ConversationSummary[];
}
