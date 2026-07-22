export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface DailyBucket {
  date: string;
  totalCents: number;
}

function localDayKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dayRange(daysAgo: number, now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function bucketOrdersByDay(
  orders: { createdAt: Date; totalCents: number }[],
  days: number,
  now: Date = new Date()
): DailyBucket[] {
  const buckets: DailyBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.push({ date: localDayKey(d), totalCents: 0 });
  }
  const indexByKey = new Map(buckets.map((b, i) => [b.date, i]));
  for (const order of orders) {
    const index = indexByKey.get(localDayKey(order.createdAt));
    if (index !== undefined) {
      buckets[index].totalCents += order.totalCents;
    }
  }
  return buckets;
}

export function formatEURCents(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
