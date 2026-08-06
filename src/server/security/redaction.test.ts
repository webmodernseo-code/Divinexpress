// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { redact } from './redaction';

describe('redact', () => {
  it('removes secrets recursively while preserving operational fields', () => {
    expect(redact({
      orderId: 'order-1', authorization: 'Bearer secret', password: 'hidden',
      customer: { email: 'client@example.com', sessionToken: 'token', city: 'Paris' },
    })).toEqual({
      orderId: 'order-1', authorization: '[REDACTED]', password: '[REDACTED]',
      customer: { email: '[REDACTED]', sessionToken: '[REDACTED]', city: 'Paris' },
    });
  });
});
