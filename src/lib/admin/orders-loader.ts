export type AdminOrdersLoadResult<T> =
  | { status: 'success'; orders: T[] }
  | { status: 'error' };

export async function loadAdminOrders<T = unknown>(
  fetcher: (input: string) => Promise<Response>,
): Promise<AdminOrdersLoadResult<T>> {
  try {
    const response = await fetcher('/api/admin/orders');
    if (!response.ok) return { status: 'error' };

    const orders = await response.json();
    if (!Array.isArray(orders)) return { status: 'error' };

    return { status: 'success', orders: orders as T[] };
  } catch {
    return { status: 'error' };
  }
}
