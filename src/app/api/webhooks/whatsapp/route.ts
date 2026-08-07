import { NextResponse } from 'next/server';
import { getCommerceDatabase } from '@/server/db/runtime';
import type { Database } from '@/server/db/client';
import {
  addMessage,
  getThread,
  phoneDigits,
  resolveCustomerId,
  upsertConversation,
} from '@/server/messaging/repository';
import {
  downloadWhatsAppMedia,
  sendWhatsAppText,
  verifyMetaSignature,
} from '@/server/messaging/whatsapp';
import { generateAgentReply, type AgentHistoryItem } from '@/server/ai/agent';
import { transcribeAudio } from '@/server/ai/transcription';
import { voiceUnclearMessage } from '@/server/ai/rules';

// --- Meta webhook verification (GET) ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Verification failed', { status: 403 });
}

interface MetaMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  audio?: { id: string };
}
interface MetaValue {
  messages?: MetaMessage[];
  contacts?: Array<{ profile?: { name?: string } }>;
}
interface MetaPayload {
  entry?: Array<{ changes?: Array<{ value?: MetaValue }> }>;
}

interface AgentCustomerRow {
  first_name: string;
  last_name: string;
  email: string | null;
}
interface AgentOrderRow {
  number: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
}

async function loadCustomer(db: Database, externalId: string): Promise<AgentCustomerRow | null> {
  const id = await resolveCustomerId(db, 'whatsapp', externalId);
  if (!id) return null;
  return (
    ((await db
      .prepare('SELECT first_name, last_name, email FROM customers WHERE id = ?')
      .get(id)) as AgentCustomerRow | undefined) ?? null
  );
}

async function loadLatestOrder(db: Database, externalId: string): Promise<AgentOrderRow | null> {
  const id = await resolveCustomerId(db, 'whatsapp', externalId);
  if (!id) return null;
  return (
    ((await db
      .prepare(
        `SELECT o.number, o.status, s.carrier, s.tracking_number
         FROM orders o LEFT JOIN shipments s ON s.order_id = o.id
         WHERE o.customer_id = ? ORDER BY o.created_at DESC LIMIT 1`,
      )
      .get(id)) as AgentOrderRow | undefined) ?? null
  );
}

async function handleMessage(
  db: Database,
  message: MetaMessage,
  profileName: string,
): Promise<void> {
  const fromPhone = message.from;
  const externalId = phoneDigits(fromPhone);

  // Resolve the message text (transcribing voice notes as needed).
  let textBody = '';
  let isVoiceNote = false;
  let unclearVoice = false;

  if (message.type === 'text') {
    textBody = message.text?.body ?? '';
  } else if (message.type === 'audio') {
    isVoiceNote = true;
    const mediaId = message.audio?.id;
    const media = mediaId ? await downloadWhatsAppMedia(mediaId) : null;
    const transcript = media ? await transcribeAudio(media.buffer, media.mimeType) : null;
    if (transcript) {
      textBody = transcript;
    } else {
      unclearVoice = true;
      textBody = '[Note vocale non transcrite]';
    }
  } else {
    return; // unsupported message type — ignore silently
  }
  if (!textBody.trim()) return;

  const conversation = await upsertConversation(db, {
    channel: 'whatsapp',
    externalId,
    displayName: profileName,
  });

  const priorThread = await getThread(db, conversation.id);

  const inbound = await addMessage(db, {
    conversationId: conversation.id,
    direction: 'inbound',
    author: 'customer',
    body: isVoiceNote ? `🎙️ ${textBody}` : textBody,
    waMessageId: message.id,
  });
  if (!inbound) return; // duplicate delivery — already processed

  // Voice note we could not understand: ask the customer to rewrite / re-record.
  if (unclearVoice) {
    const reply = voiceUnclearMessage();
    await addMessage(db, {
      conversationId: conversation.id,
      direction: 'outbound',
      author: 'ai',
      body: reply,
    });
    await sendWhatsAppText(fromPhone, reply);
    return;
  }

  // A human has taken over this conversation — leave it unread, no AI reply.
  if (conversation.ai_enabled !== 1) return;

  const customer = await loadCustomer(db, externalId);
  const order = await loadLatestOrder(db, externalId);
  const history: AgentHistoryItem[] = priorThread.map((m) => ({
    role: m.author === 'customer' ? 'customer' : 'assistant',
    text: m.body,
  }));

  const { text } = await generateAgentReply({
    channel: 'whatsapp',
    displayName: profileName,
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
    history,
    message: textBody,
    isVoiceNote,
  });

  await addMessage(db, {
    conversationId: conversation.id,
    direction: 'outbound',
    author: 'ai',
    body: text,
  });
  await sendWhatsAppText(fromPhone, text);
}

// --- Incoming messages (POST) ---
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyMetaSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
  }

  let payload: MetaPayload;
  try {
    payload = JSON.parse(rawBody) as MetaPayload;
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  try {
    const db = await getCommerceDatabase();
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value?.messages?.length) continue;
        const profileName = value.contacts?.[0]?.profile?.name || 'Client WhatsApp';
        for (const message of value.messages) {
          await handleMessage(db, message, profileName);
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[whatsapp-webhook] processing error:', error);
    return NextResponse.json({ error: 'WEBHOOK_PROCESSING_FAILED' }, { status: 500 });
  }
}
