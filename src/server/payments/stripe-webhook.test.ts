// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyStripeSignature } from './stripe-webhook';

const secret = 'whsec_test';
const body = '{"id":"evt_1","type":"checkout.session.completed"}';
const ts = '1700000000';
const validSig = createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');

describe('verifyStripeSignature', () => {
  it('accepts a valid signature', () => {
    expect(verifyStripeSignature(`t=${ts},v1=${validSig}`, body, secret)).toBe(true);
  });

  it('rejects a tampered body', () => {
    expect(verifyStripeSignature(`t=${ts},v1=${validSig}`, `${body}x`, secret)).toBe(false);
  });

  it('rejects a wrong secret', () => {
    expect(verifyStripeSignature(`t=${ts},v1=${validSig}`, body, 'whsec_other')).toBe(false);
  });

  it('rejects a missing or malformed header', () => {
    expect(verifyStripeSignature(null, body, secret)).toBe(false);
    expect(verifyStripeSignature('nope', body, secret)).toBe(false);
  });
});
