import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a Stripe webhook signature. The `Stripe-Signature` header looks like
 * `t=<timestamp>,v1=<hmac>`; the signed payload is `${timestamp}.${rawBody}`
 * HMAC-SHA256'd with the endpoint's signing secret.
 */
export function verifyStripeSignature(header: string | null, rawBody: string, secret: string): boolean {
  if (!header) return false;
  const parts = new Map(
    header.split(',').map((part) => {
      const index = part.indexOf('=');
      return [part.slice(0, index), part.slice(index + 1)] as const;
    })
  );
  const timestamp = parts.get('t');
  const signature = parts.get('v1');
  if (!timestamp || !signature) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}
