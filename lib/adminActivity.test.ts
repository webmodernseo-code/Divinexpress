import { describe, it, expect } from 'vitest';
import { buildActivityFeed, formatRelativeTime } from './adminActivity';

describe('buildActivityFeed', () => {
  it('merges and sorts orders and products by most recent first', () => {
    const orders = [{ id: 'o1', orderNumber: '#1001', totalCents: 5000, createdAt: new Date(2026, 6, 20, 10, 0, 0), currency: 'EUR' }];
    const products = [{ id: 'p1', nameFr: 'Veste', createdAt: new Date(2026, 6, 21, 9, 0, 0) }];
    const feed = buildActivityFeed(orders, products, 5);
    expect(feed.map((item) => item.id)).toEqual(['p1', 'o1']);
  });

  it('respects the limit', () => {
    const orders = Array.from({ length: 5 }, (_, i) => ({
      id: `o${i}`,
      orderNumber: `#${i}`,
      totalCents: 100,
      createdAt: new Date(2026, 6, 21, i, 0, 0),
      currency: 'EUR'
    }));
    const feed = buildActivityFeed(orders, [], 3);
    expect(feed).toHaveLength(3);
  });

  it('includes amountCents for orders but not for products', () => {
    const orders = [{ id: 'o1', orderNumber: '#1001', totalCents: 5000, createdAt: new Date(2026, 6, 20), currency: 'EUR' }];
    const products = [{ id: 'p1', nameFr: 'Veste', createdAt: new Date(2026, 6, 19) }];
    const feed = buildActivityFeed(orders, products, 5);
    expect(feed.find((i) => i.id === 'o1')?.amountCents).toBe(5000);
    expect(feed.find((i) => i.id === 'p1')?.amountCents).toBeUndefined();
  });
});

describe('formatRelativeTime', () => {
  const now = new Date(2026, 6, 21, 12, 0, 0);

  it('formats less than a minute as "à l\'instant"', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 11, 59, 30), now)).toBe("à l'instant");
  });

  it('formats minutes (singular)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 11, 59, 0), now)).toBe('il y a 1 minute');
  });

  it('formats minutes (plural)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 11, 45, 0), now)).toBe('il y a 15 minutes');
  });

  it('formats hours (singular)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 11, 0, 0), now)).toBe('il y a 1 heure');
  });

  it('formats hours (plural)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 21, 8, 0, 0), now)).toBe('il y a 4 heures');
  });

  it('formats days (singular)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 20, 12, 0, 0), now)).toBe('il y a 1 jour');
  });

  it('formats days (plural)', () => {
    expect(formatRelativeTime(new Date(2026, 6, 18, 12, 0, 0), now)).toBe('il y a 3 jours');
  });
});
