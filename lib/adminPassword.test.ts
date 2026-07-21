import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './adminPassword';

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
