import { describe, expect, it, vi } from 'vitest';
import { loadAdminOrders } from './orders-loader';

describe('loadAdminOrders', () => {
  it('returns an empty successful result when there are no orders', async () => {
    const result = await loadAdminOrders(async () => new Response('[]', { status: 200 }));
    expect(result).toEqual({ status: 'success', orders: [] });
  });

  it('returns a recoverable error when the API fails', async () => {
    const result = await loadAdminOrders(async () => new Response('{"error":"UNAVAILABLE"}', { status: 503 }));
    expect(result).toEqual({ status: 'error' });
  });

  it('requests the admin orders endpoint', async () => {
    const fetcher = vi.fn(async () => new Response('[]', { status: 200 }));
    await loadAdminOrders(fetcher);
    expect(fetcher).toHaveBeenCalledWith('/api/admin/orders');
  });
});
