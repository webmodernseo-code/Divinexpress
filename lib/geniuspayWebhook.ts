import { createHmac, timingSafeEqual } from 'crypto';

const MAX_TIMESTAMP_SKEW_SECONDS = 300;

export function isValidWebhookTimestamp(timestamp: number, now: number = Math.floor(Date.now() / 1000)): boolean {
  return Math.abs(now - timestamp) <= MAX_TIMESTAMP_SKEW_SECONDS;
}

export function verifyWebhookSignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
  const expectedHex = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  let expectedBuffer: Buffer;
  let signatureBuffer: Buffer;
  try {
    expectedBuffer = Buffer.from(expectedHex, 'hex');
    signatureBuffer = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
