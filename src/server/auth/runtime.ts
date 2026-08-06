import { cookies } from 'next/headers';
import { getCommerceDatabase } from '../db/runtime';
import { SlidingWindowRateLimiter } from './rate-limit';
import { AuthService } from './session';

export const ADMIN_SESSION_COOKIE = 'reign_admin_session';
export const loginRateLimiter = new SlidingWindowRateLimiter(5, 15 * 60 * 1_000);

let service: AuthService | undefined;

export async function getAuthService(): Promise<AuthService> {
  if (service) return service;
  const database = await getCommerceDatabase();
  service = new AuthService(database);

  const count = (await database.prepare('SELECT COUNT(*) AS count FROM admin_users').get()) as { count: number };
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (count.count === 0 && process.env.NODE_ENV !== 'production' && email && password) {
    await service.createAdmin({ email, password, role: 'owner' });
  }
  return service;
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const authService = await getAuthService();
  const session = await authService.findSession(token);
  return session?.user ?? null;
}
