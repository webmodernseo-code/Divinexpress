import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto';

const SCRYPT_KEYLEN = 64;
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const candidateHash = scryptSync(password, salt, SCRYPT_KEYLEN);
  const storedHashBuffer = Buffer.from(hash, 'hex');
  if (candidateHash.length !== storedHashBuffer.length) return false;
  return timingSafeEqual(candidateHash, storedHashBuffer);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(adminId: string, secret: string, now: number = Date.now()): string {
  const expiresAt = now + SESSION_DURATION_MS;
  const payload = `${adminId}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  now: number = Date.now()
): { adminId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [adminId, expiresAtStr, signature] = parts;
  const expiresAt = Number(expiresAtStr);
  if (!adminId || !expiresAtStr || !signature || Number.isNaN(expiresAt)) return null;

  const expectedSignature = sign(`${adminId}.${expiresAtStr}`, secret);
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  if (expiresAt < now) return null;

  return { adminId };
}

export function shouldRedirectToLogin(
  pathname: string,
  sessionCookieValue: string | undefined,
  secret: string
): boolean {
  if (!pathname.startsWith('/admin')) return false;
  if (pathname === '/admin/login') return false;
  if (!sessionCookieValue) return true;
  return verifySessionToken(sessionCookieValue, secret) === null;
}
