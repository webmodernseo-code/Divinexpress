export type DiscountKind = 'PERCENT' | 'FIXED';

export function computeDiscountCents(subtotalCents: number, type: DiscountKind, value: number): number {
  const raw = type === 'PERCENT' ? Math.round((subtotalCents * value) / 100) : value;
  return Math.min(Math.max(raw, 0), subtotalCents);
}
