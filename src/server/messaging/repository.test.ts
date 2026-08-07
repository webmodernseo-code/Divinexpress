// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import {
  addMessage,
  countUnreadConversations,
  getThread,
  listConversationSummaries,
  markRead,
  phoneDigits,
  phoneSuffix,
  resolveCustomerId,
  setAiEnabled,
  setStatus,
  upsertConversation,
} from './repository';

async function freshDb(): Promise<Database> {
  const db = createDatabase(':memory:');
  await migrateDatabase(db);
  return db;
}

describe('messaging repository', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('normalizes phone numbers', () => {
    expect(phoneDigits('+33 6 12 34 56 78')).toBe('33612345678');
    expect(phoneSuffix('+33 6 12 34 56 78')).toBe('612345678');
    expect(phoneSuffix('0612345678', 9)).toBe('612345678');
  });

  it('creates a conversation once per (channel, external_id)', async () => {
    const db = await freshDb();
    const first = await upsertConversation(db, {
      channel: 'whatsapp',
      externalId: '33612345678',
      displayName: 'Client WhatsApp',
    });
    const second = await upsertConversation(db, {
      channel: 'whatsapp',
      externalId: '33612345678',
      displayName: 'Jean Dupont',
    });
    expect(second.id).toBe(first.id);
    expect(second.display_name).toBe('Jean Dupont');
    expect(second.ai_enabled).toBe(1);
  });

  it('links a conversation to an existing customer by phone suffix', async () => {
    const db = await freshDb();
    await db
      .prepare(
        `INSERT INTO customers (id, email, first_name, last_name, phone)
         VALUES ('c1', 'jean@example.com', 'Jean', 'Dupont', '+33 6 12 34 56 78')`,
      )
      .run();
    const customerId = await resolveCustomerId(db, 'whatsapp', '33612345678');
    expect(customerId).toBe('c1');
    const conv = await upsertConversation(db, { channel: 'whatsapp', externalId: '33612345678' });
    expect(conv.customer_id).toBe('c1');
  });

  it('deduplicates inbound messages by wa_message_id and tracks unread', async () => {
    const db = await freshDb();
    const conv = await upsertConversation(db, { channel: 'whatsapp', externalId: '33600000000' });

    const inserted = await addMessage(db, {
      conversationId: conv.id,
      direction: 'inbound',
      author: 'customer',
      body: 'Bonjour',
      waMessageId: 'wamid.ABC',
    });
    const duplicate = await addMessage(db, {
      conversationId: conv.id,
      direction: 'inbound',
      author: 'customer',
      body: 'Bonjour',
      waMessageId: 'wamid.ABC',
    });

    expect(inserted).not.toBeNull();
    expect(duplicate).toBeNull();
    expect(await countUnreadConversations(db)).toBe(1);

    const thread = await getThread(db, conv.id);
    expect(thread).toHaveLength(1);
    expect(thread[0].status).toBe('received');
  });

  it('outbound AI replies do not increment unread', async () => {
    const db = await freshDb();
    const conv = await upsertConversation(db, { channel: 'whatsapp', externalId: '33600000001' });
    await addMessage(db, { conversationId: conv.id, direction: 'inbound', author: 'customer', body: 'Suivi ?' });
    await addMessage(db, { conversationId: conv.id, direction: 'outbound', author: 'ai', body: 'Voici votre suivi.' });

    const summaries = await listConversationSummaries(db);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].unread_count).toBe(1);
    expect(summaries[0].last_message_preview).toBe('Voici votre suivi.');

    await markRead(db, conv.id);
    expect(await countUnreadConversations(db)).toBe(0);
  });

  it('toggles ai and status independently', async () => {
    const db = await freshDb();
    const conv = await upsertConversation(db, { channel: 'whatsapp', externalId: '33600000002' });
    await setAiEnabled(db, conv.id, false);
    await setStatus(db, conv.id, 'resolved');
    const summaries = await listConversationSummaries(db);
    expect(summaries[0].ai_enabled).toBe(0);
    expect(summaries[0].status).toBe('resolved');
  });
});
