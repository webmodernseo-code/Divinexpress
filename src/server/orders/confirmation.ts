import type { Database } from '../db/client';

export interface OrderConfirmation {
  number: string;
  status: string;
  currency: string;
  totalMinor: number;
}

export async function findOrderConfirmation(
  database: Database,
  orderNumber: string,
): Promise<OrderConfirmation | null> {
  const row = await database.prepare(`SELECT number, status, currency, total_minor
    FROM orders WHERE number = ? LIMIT 1`).get(orderNumber) as {
      number: string;
      status: string;
      currency: string;
      total_minor: number;
    } | undefined;

  return row ? {
    number: row.number,
    status: row.status,
    currency: row.currency,
    totalMinor: row.total_minor,
  } : null;
}
