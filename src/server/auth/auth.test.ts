// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '../db/client';
import { migrateDatabase } from '../db/migrate';
import { DomainError } from '../domain/errors';
import { requireRole } from './authorization';
import { hashPassword, verifyPassword } from './password';
import { SlidingWindowRateLimiter } from './rate-limit';
import { AuthService } from './session';

describe('password hashing', () => {
  it('uses a random salt and verifies only the original password', () => {
    const first = hashPassword('correct horse battery staple');
    const second = hashPassword('correct horse battery staple');

    expect(first).not.toBe(second);
    expect(verifyPassword('correct horse battery staple', first)).toBe(true);
    expect(verifyPassword('wrong password', first)).toBe(false);
  });
});

describe('authentication rate limiting', () => {
  it('blocks attempts over the limit until the window expires', () => {
    let now = 1_000;
    const limiter = new SlidingWindowRateLimiter(2, 1_000, () => now);
    limiter.consume('admin@divinexpress.local');
    limiter.consume('admin@divinexpress.local');
    expect(() => limiter.consume('admin@divinexpress.local'))
      .toThrowError(new DomainError('RATE_LIMITED', 'Too many attempts', 429));

    now = 2_001;
    expect(() => limiter.consume('admin@divinexpress.local')).not.toThrow();
  });
});

describe('server sessions and authorization', () => {
  let database: Database;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('authenticates an active administrator and stores only a token hash', async () => {
    const auth = new AuthService(database, () => new Date('2026-08-04T10:00:00.000Z'));
    await auth.createAdmin({
      id: 'admin-1',
      email: 'Owner@DivinExpress.Local',
      password: 'a strong development password',
      role: 'owner',
    });

    const session = await auth.authenticate('owner@divinexpress.local', 'a strong development password');
    const stored = (await database.prepare('SELECT token_hash FROM admin_sessions WHERE id = ?')
      .get(session.id)) as { token_hash: string };

    expect(session.token).toHaveLength(64);
    expect(stored.token_hash).not.toBe(session.token);
    expect((await auth.findSession(session.token))?.user.email).toBe('owner@divinexpress.local');
  });

  it('rejects invalid credentials, expired sessions, and revoked sessions', async () => {
    let now = new Date('2026-08-04T10:00:00.000Z');
    const auth = new AuthService(database, () => now, 1_000);
    await auth.createAdmin({ id: 'admin-1', email: 'admin@divinexpress.local', password: 'valid password', role: 'manager' });

    await expect(auth.authenticate('admin@divinexpress.local', 'wrong'))
      .rejects.toThrowError(new DomainError('UNAUTHORIZED', 'Invalid credentials', 401));

    const session = await auth.authenticate('admin@divinexpress.local', 'valid password');
    now = new Date('2026-08-04T10:00:02.000Z');
    expect(await auth.findSession(session.token)).toBeNull();

    now = new Date('2026-08-04T10:00:00.000Z');
    const replacement = await auth.authenticate('admin@divinexpress.local', 'valid password');
    await auth.revokeSession(replacement.token);
    expect(await auth.findSession(replacement.token)).toBeNull();
  });

  it('updates owner credentials only with the current password and revokes existing sessions', async () => {
    const auth = new AuthService(database, () => new Date('2026-08-30T10:00:00.000Z'));
    await auth.createAdmin({
      id: 'admin-1',
      email: 'owner@divinexpress.local',
      password: 'old secure password',
      role: 'owner',
    });
    const existingSession = await auth.authenticate('owner@divinexpress.local', 'old secure password');

    await expect(auth.updateCredentials({
      userId: 'admin-1',
      currentPassword: 'wrong password',
      email: 'webmodernseo@gmail.com',
      newPassword: 'New secure password 2026!',
    })).rejects.toThrowError(new DomainError('UNAUTHORIZED', 'Current password is invalid', 401));

    await auth.updateCredentials({
      userId: 'admin-1',
      currentPassword: 'old secure password',
      email: 'WebModernSEO@gmail.com',
      newPassword: 'New secure password 2026!',
    });

    expect(await auth.findSession(existingSession.token)).toBeNull();
    await expect(auth.authenticate('owner@divinexpress.local', 'old secure password'))
      .rejects.toThrowError(new DomainError('UNAUTHORIZED', 'Invalid credentials', 401));
    await expect(auth.authenticate('webmodernseo@gmail.com', 'New secure password 2026!'))
      .resolves.toMatchObject({ token: expect.any(String) });
  });

  it('enforces the role matrix', () => {
    expect(() => requireRole('support', ['owner', 'manager']))
      .toThrowError(new DomainError('FORBIDDEN', 'Insufficient permissions', 403));
    expect(() => requireRole('manager', ['owner', 'manager'])).not.toThrow();
  });
});
