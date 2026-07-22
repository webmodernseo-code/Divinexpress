import { randomBytes } from 'crypto';

export function generateOrderNumber(date: Date = new Date()): string {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = randomBytes(4).toString('hex').toUpperCase();
  return `DX-${datePart}-${randomPart}`;
}
