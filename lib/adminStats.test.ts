import { describe, it, expect } from 'vitest';
import { percentChange, bucketOrdersByDay, dayRange, formatEURCents } from './adminStats';

describe('percentChange', () => {
  it('computes a positive percent change', () => {
    expect(percentChange(150, 100)).toBe(50);
  });

  it('computes a negative percent change', () => {
    expect(percentChange(50, 100)).toBe(-50);
  });

  it('returns null when the previous value is zero', () => {
    expect(percentChange(100, 0)).toBeNull();
  });

  it('returns null when the previous value is negative', () => {
    expect(percentChange(100, -10)).toBeNull();
  });
});

describe('dayRange', () => {
  const now = new Date(2026, 6, 21, 15, 30, 0); // 21 July 2026, 15:30 local

  it("returns today's local midnight-to-midnight range for daysAgo=0", () => {
    const { start, end } = dayRange(0, now);
    expect(start).toEqual(new Date(2026, 6, 21, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 6, 22, 0, 0, 0));
  });

  it("returns yesterday's range for daysAgo=1", () => {
    const { start, end } = dayRange(1, now);
    expect(start).toEqual(new Date(2026, 6, 20, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 6, 21, 0, 0, 0));
  });
});

describe('bucketOrdersByDay', () => {
  const now = new Date(2026, 6, 21, 12, 0, 0);

  it('places orders into the correct daily bucket', () => {
    const orders = [
      { createdAt: new Date(2026, 6, 21, 9, 0, 0), totalCents: 1000 },
      { createdAt: new Date(2026, 6, 21, 18, 0, 0), totalCents: 500 },
      { createdAt: new Date(2026, 6, 20, 10, 0, 0), totalCents: 2000 }
    ];
    const buckets = bucketOrdersByDay(orders, 3, now);
    expect(buckets).toHaveLength(3);
    expect(buckets[2].totalCents).toBe(1500); // today (21st): 1000 + 500
    expect(buckets[1].totalCents).toBe(2000); // yesterday (20th)
    expect(buckets[0].totalCents).toBe(0); // day before (19th), no orders
  });

  it('ignores orders outside the bucket range', () => {
    const orders = [{ createdAt: new Date(2026, 5, 1, 0, 0, 0), totalCents: 9999 }];
    const buckets = bucketOrdersByDay(orders, 3, now);
    const total = buckets.reduce((sum, b) => sum + b.totalCents, 0);
    expect(total).toBe(0);
  });

  it('returns buckets in chronological order with correct date keys', () => {
    const buckets = bucketOrdersByDay([], 3, now);
    expect(buckets.map((b) => b.date)).toEqual(['2026-07-19', '2026-07-20', '2026-07-21']);
  });
});

describe('formatEURCents', () => {
  it('formats cents as a French EUR string', () => {
    expect(formatEURCents(4990)).toMatch(/49,90\s*€/);
  });

  it('formats zero correctly', () => {
    expect(formatEURCents(0)).toMatch(/0,00\s*€/);
  });
});
