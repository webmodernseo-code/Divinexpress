import { cookies } from 'next/headers';
import { getCommerceDatabase } from '../db/runtime';
import type { Database } from '../db/client';
import { SlidingWindowRateLimiter } from './rate-limit';
import { AuthService } from './session';

export const ADMIN_SESSION_COOKIE = 'divinexpress_admin_session';
export const loginRateLimiter = new SlidingWindowRateLimiter(5, 15 * 60 * 1_000);

let service: AuthService | undefined;

export async function ensureBootstrapAdmin(
  database: Database,
  authService: AuthService,
  email: string | undefined,
  password: string | undefined,
): Promise<void> {
  if (!email || !password) return;
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await database.prepare('SELECT id FROM admin_users WHERE email = ?').get(normalizedEmail);
  if (existing) return;
  try {
    await authService.createAdmin({ email: normalizedEmail, password, role: 'owner' });
  } catch (error) {
    // Tolerate only a confirmed concurrent creation of the same unique email.
    const concurrentlyCreated = await database.prepare('SELECT id FROM admin_users WHERE email = ?').get(normalizedEmail);
    if (!concurrentlyCreated) throw error;
  }
}

export async function getAuthService(): Promise<AuthService> {
  if (service) return service;
  const database = await getCommerceDatabase();
  service = new AuthService(database);

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  // Create the configured owner only when that exact email is absent.
  // Existing accounts and passwords are never overwritten.
  await ensureBootstrapAdmin(database, service, email, password);
  return service;
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const authService = await getAuthService();
  const session = await authService.findSession(token);
  return session?.user ?? null;
}
