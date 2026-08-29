import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Database } from '../db/client';
import { DomainError } from '../domain/errors';
import type { AdminRole } from './authorization';
import { hashPassword, verifyPassword } from './password';

interface AdminInput { id?: string; email: string; password: string; role: AdminRole }
interface AdminUser { id: string; email: string; role: AdminRole }
interface SessionRecord { id: string; token: string; expiresAt: string }
interface StoredUser extends AdminUser { password_hash: string; active: number }
interface CredentialUpdateInput {
  userId: string;
  currentPassword: string;
  email: string;
  newPassword?: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export class AuthService {
  constructor(
    private readonly database: Database,
    private readonly now: () => Date = () => new Date(),
    private readonly sessionDurationMs = 8 * 60 * 60 * 1_000,
  ) {}

  async createAdmin(input: AdminInput): Promise<AdminUser> {
    const email = normalizeEmail(input.email);
    if (input.password.length < 8) throw new DomainError('CONFLICT', 'Password is too short');
    const id = input.id ?? randomUUID();
    await this.database.prepare(`INSERT INTO admin_users
      (id, email, password_hash, role) VALUES (?, ?, ?, ?)`)
      .run(id, email, hashPassword(input.password), input.role);
    return { id, email, role: input.role };
  }

  async authenticate(emailInput: string, password: string): Promise<SessionRecord> {
    const user = (await this.database.prepare(`SELECT id, email, password_hash, role, active
      FROM admin_users WHERE email = ?`).get(normalizeEmail(emailInput))) as StoredUser | undefined;
    if (!user || user.active !== 1 || !verifyPassword(password, user.password_hash)) {
      throw new DomainError('UNAUTHORIZED', 'Invalid credentials', 401);
    }
    const token = randomBytes(32).toString('hex');
    const id = randomUUID();
    const expiresAt = new Date(this.now().getTime() + this.sessionDurationMs).toISOString();
    await this.database.prepare(`INSERT INTO admin_sessions
      (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`)
      .run(id, user.id, hashToken(token), expiresAt);
    return { id, token, expiresAt };
  }

  async createDevelopmentSession(): Promise<SessionRecord> {
    let user = (await this.database.prepare(`SELECT id, email, password_hash, role, active
      FROM admin_users WHERE active = 1 ORDER BY created_at ASC LIMIT 1`).get()) as StoredUser | undefined;
    if (!user) {
      await this.createAdmin({ email: 'admin@divinexpress.local', password: 'adminpassword', role: 'owner' });
      user = (await this.database.prepare(`SELECT id, email, password_hash, role, active
        FROM admin_users WHERE email = ?`).get('admin@divinexpress.local')) as StoredUser;
    }
    const token = randomBytes(32).toString('hex');
    const id = randomUUID();
    const expiresAt = new Date(this.now().getTime() + this.sessionDurationMs).toISOString();
    await this.database.prepare(`INSERT INTO admin_sessions
      (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`)
      .run(id, user.id, hashToken(token), expiresAt);
    return { id, token, expiresAt };
  }

  async updateCredentials(input: CredentialUpdateInput): Promise<void> {
    await this.database.exec('BEGIN IMMEDIATE');
    try {
      const user = (await this.database.prepare(`SELECT id, email, password_hash, role, active
        FROM admin_users WHERE id = ? AND active = 1`).get(input.userId)) as StoredUser | undefined;
      if (!user || !verifyPassword(input.currentPassword, user.password_hash)) {
        throw new DomainError('UNAUTHORIZED', 'Current password is invalid', 401);
      }
      if (input.newPassword && input.newPassword.length < 8) {
        throw new DomainError('CONFLICT', 'Password is too short');
      }

      const nextEmail = normalizeEmail(input.email);
      const nextPasswordHash = input.newPassword ? hashPassword(input.newPassword) : user.password_hash;
      await this.database.prepare(`UPDATE admin_users
        SET email = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(nextEmail, nextPasswordHash, user.id);
      await this.database.prepare('DELETE FROM admin_sessions WHERE user_id = ?').run(user.id);
      await this.database.exec('COMMIT');
    } catch (error) {
      await this.database.exec('ROLLBACK');
      throw error;
    }
  }

  async findSession(token: string): Promise<{ id: string; user: AdminUser; expiresAt: string } | null> {
    const row = (await this.database.prepare(`SELECT s.id, s.expires_at,
        u.id AS user_id, u.email, u.role
      FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND u.active = 1 AND s.expires_at > ?`)
      .get(hashToken(token), this.now().toISOString())) as
        | { id: string; expires_at: string; user_id: string; email: string; role: AdminRole }
        | undefined;
    if (!row) return null;
    return {
      id: row.id,
      user: { id: row.user_id, email: row.email, role: row.role },
      expiresAt: row.expires_at,
    };
  }

  async revokeSession(token: string): Promise<void> {
    await this.database.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(hashToken(token));
  }
}
