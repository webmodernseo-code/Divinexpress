import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

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

// Session tokens are verified from `middleware.ts`, which Next.js runs in
// the Edge runtime — Node's `crypto.createHmac`/`timingSafeEqual` don't
// exist there and throw at request time. The Web Crypto API (`crypto.subtle`)
// is available as a global in both the Edge runtime and Node.js 19+, so it's
// used here instead for the HMAC signing/verification path.
async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Buffer.from(signatureBuffer).toString('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionToken(adminId: string, secret: string, now: number = Date.now()): Promise<string> {
  const expiresAt = now + SESSION_DURATION_MS;
  const payload = `${adminId}.${expiresAt}`;
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
  now: number = Date.now()
): Promise<{ adminId: string } | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [adminId, expiresAtStr, signature] = parts;
  const expiresAt = Number(expiresAtStr);
  if (!adminId || !expiresAtStr || !signature || Number.isNaN(expiresAt)) return null;

  const expectedSignature = await sign(`${adminId}.${expiresAtStr}`, secret);
  if (!timingSafeEqualHex(signature, expectedSignature)) return null;
  if (expiresAt < now) return null;

  return { adminId };
}

export async function shouldRedirectToLogin(
  pathname: string,
  sessionCookieValue: string | undefined,
  secret: string
): Promise<boolean> {
  if (!pathname.startsWith('/admin')) return false;
  if (pathname === '/admin/login') return false;
  if (!sessionCookieValue) return true;
  return (await verifySessionToken(sessionCookieValue, secret)) === null;
}
