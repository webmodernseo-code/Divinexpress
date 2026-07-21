import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  shouldRedirectToLogin
} from './adminAuth';

describe('hashPassword / verifyPassword', () => {
  it('verifies a correct password against its hash', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    expect(verifyPassword('correct-horse-battery-staple', hash)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    expect(verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('produces a different salt on each call', () => {
    const hashA = hashPassword('same-password');
    const hashB = hashPassword('same-password');
    expect(hashA).not.toBe(hashB);
  });

  it('rejects a malformed stored hash', () => {
    expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
  });
});

describe('createSessionToken / verifySessionToken', () => {
  const secret = 'test-secret';

  it('round-trips a valid token', () => {
    const token = createSessionToken('admin-1', secret);
    expect(verifySessionToken(token, secret)).toEqual({ adminId: 'admin-1' });
  });

  it('rejects a token signed with a different secret', () => {
    const token = createSessionToken('admin-1', secret);
    expect(verifySessionToken(token, 'other-secret')).toBeNull();
  });

  it('rejects a tampered token', () => {
    const token = createSessionToken('admin-1', secret);
    const tampered = token.replace('admin-1', 'admin-2');
    expect(verifySessionToken(tampered, secret)).toBeNull();
  });

  it('rejects an expired token', () => {
    const now = 1_000_000;
    const token = createSessionToken('admin-1', secret, now);
    const eightDaysLater = now + 1000 * 60 * 60 * 24 * 8;
    expect(verifySessionToken(token, secret, eightDaysLater)).toBeNull();
  });

  it('accepts a token just before expiry', () => {
    const now = 1_000_000;
    const token = createSessionToken('admin-1', secret, now);
    const sixDaysLater = now + 1000 * 60 * 60 * 24 * 6;
    expect(verifySessionToken(token, secret, sixDaysLater)).toEqual({ adminId: 'admin-1' });
  });

  it('rejects a malformed token', () => {
    expect(verifySessionToken('not.enough.parts.here', secret)).toBeNull();
    expect(verifySessionToken('only-one-part', secret)).toBeNull();
  });
});

describe('shouldRedirectToLogin', () => {
  const secret = 'test-secret';

  it('never redirects for non-admin paths', () => {
    expect(shouldRedirectToLogin('/fr/boutique', undefined, secret)).toBe(false);
  });

  it('never redirects the login page itself', () => {
    expect(shouldRedirectToLogin('/admin/login', undefined, secret)).toBe(false);
  });

  it('redirects an admin path with no session cookie', () => {
    expect(shouldRedirectToLogin('/admin', undefined, secret)).toBe(true);
  });

  it('redirects an admin path with an invalid session cookie', () => {
    expect(shouldRedirectToLogin('/admin', 'garbage', secret)).toBe(true);
  });

  it('allows an admin path with a valid session cookie', () => {
    const token = createSessionToken('admin-1', secret);
    expect(shouldRedirectToLogin('/admin', token, secret)).toBe(false);
  });
});
