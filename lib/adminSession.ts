// Edge-safe: this module is imported by middleware.ts, which Next.js runs
// in the Edge runtime. Node-only APIs (crypto.createHmac, crypto.scryptSync,
// crypto.timingSafeEqual, fs, etc.) are NOT available there and throw at
// request time — keep this file limited to Web-standard globals (crypto.subtle,
// TextEncoder, Buffer), which work in both the Edge runtime and Node.js 19+.
// Password hashing (Node-only, scrypt) lives in ./adminPassword instead,
// which must never be imported from here or from middleware.ts.

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

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
