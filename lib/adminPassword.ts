import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_KEYLEN = 64;

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
