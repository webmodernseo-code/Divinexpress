import { createHmac, timingSafeEqual } from 'node:crypto';

/** Graph API version used for all WhatsApp Cloud API calls. */
function graphVersion(): string {
  return process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Verifies the Meta `X-Hub-Signature-256` header against the raw request body.
 * Returns true when no app secret is configured (development), so local testing
 * without Meta credentials still works; in production the secret must be set.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true; // dev fallback — no secret configured
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  const provided = signatureHeader.slice('sha256='.length);
  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(provided, 'hex');
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

/** Sends a plain text WhatsApp message. Returns true on success. */
export async function sendWhatsAppText(to: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.warn('[whatsapp] not configured — skipping outbound send');
    return false;
  }
  const cleanPhone = to.replace(/[^0-9]/g, '');
  const url = `https://graph.facebook.com/${graphVersion()}/${phoneId}/messages`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    });
    if (!res.ok) {
      console.error('[whatsapp] send failed:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[whatsapp] send error:', err);
    return false;
  }
}

export interface WhatsAppMedia {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Downloads a media object (e.g. a voice note) from the WhatsApp Cloud API.
 * Two steps: resolve the media id to a temporary URL, then fetch the bytes.
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<WhatsAppMedia | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const infoRes = await fetch(`https://graph.facebook.com/${graphVersion()}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!infoRes.ok) {
      console.error('[whatsapp] media info failed:', await infoRes.text());
      return null;
    }
    const info = (await infoRes.json()) as { url?: string; mime_type?: string };
    if (!info.url) return null;

    const mediaRes = await fetch(info.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!mediaRes.ok) {
      console.error('[whatsapp] media download failed:', mediaRes.status);
      return null;
    }
    const arrayBuffer = await mediaRes.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), mimeType: info.mime_type || 'audio/ogg' };
  } catch (err) {
    console.error('[whatsapp] media error:', err);
    return null;
  }
}
