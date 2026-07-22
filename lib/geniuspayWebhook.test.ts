import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { verifyWebhookSignature, isValidWebhookTimestamp } from './geniuspayWebhook';

describe('verifyWebhookSignature', () => {
  const secret = 'whsec_test_secret';
  const timestamp = '1735587600';
  const body = '{"event":"payment.success"}';
  const validSignature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

  it('accepts a correctly computed signature', () => {
    expect(verifyWebhookSignature(body, timestamp, validSignature, secret)).toBe(true);
  });

  it('rejects a signature computed over a different (tampered) body', () => {
    const tamperedBody = '{"event":"payment.failed"}';
    expect(verifyWebhookSignature(tamperedBody, timestamp, validSignature, secret)).toBe(false);
  });

  it('rejects a signature computed with the wrong secret', () => {
    const wrongSignature = createHmac('sha256', 'wrong_secret').update(`${timestamp}.${body}`).digest('hex');
    expect(verifyWebhookSignature(body, timestamp, wrongSignature, secret)).toBe(false);
  });

  it('rejects a malformed (non-hex or wrong-length) signature without throwing', () => {
    expect(verifyWebhookSignature(body, timestamp, 'not-a-valid-signature', secret)).toBe(false);
  });
});

describe('isValidWebhookTimestamp', () => {
  it('accepts a timestamp within the 5 minute window', () => {
    expect(isValidWebhookTimestamp(1000, 1000 + 200)).toBe(true);
  });

  it('accepts a timestamp exactly at the 300 second boundary', () => {
    expect(isValidWebhookTimestamp(1000, 1000 + 300)).toBe(true);
  });

  it('rejects a timestamp older than 5 minutes', () => {
    expect(isValidWebhookTimestamp(1000, 1000 + 301)).toBe(false);
  });
});
