import type { AdminDemoState, DashboardPeriod, OrderStatus } from '@/lib/admin/types';
import type { Database } from '../db/client';

const periodDays: Record<DashboardPeriod, number> = { '7d': 7, '30d': 30, '90d': 90 };
const statusLabels: Record<string, OrderStatus> = {
  paid: 'Payée', preparing: 'En préparation', shipped: 'Expédiée',
  delivered: 'Expédiée', cancelled: 'Annulée', refunded: 'Annulée', pending_payment: 'En préparation',
};

const formatEur = (minor: number) => new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
}).format(minor / 100);

export async function getDashboardState(
  database: Database,
  period: DashboardPeriod,
  now = new Date(),
): Promise<AdminDemoState> {
  const cutoff = new Date(now.getTime() - periodDays[period] * 86_400_000).toISOString();
  const summary = (await database.prepare(`SELECT
      COUNT(*) AS orders,
      COALESCE(SUM(CASE WHEN status IN ('paid','preparing','shipped','delivered') THEN total_minor ELSE 0 END), 0) AS revenue,
      COALESCE(AVG(CASE WHEN status IN ('paid','preparing','shipped','delivered') THEN total_minor END), 0) AS basket,
      SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS returns
    FROM orders WHERE created_at >= ?`).get(cutoff)) as {
      orders: number; revenue: number; basket: number; returns: number;
    } | undefined;
  const summaryVal = summary ?? { orders: 0, revenue: 0, basket: 0, returns: 0 };
  const recent = (await database.prepare(`SELECT o.number, o.created_at, o.status, o.total_minor,
      c.first_name, c.last_name, c.email FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id ORDER BY o.created_at DESC LIMIT 5`)
    .all()) as unknown as Array<{
      number: string; created_at: string; status: string; total_minor: number;
      first_name: string | null; last_name: string | null; email: string | null;
    }>;
  const stock = (await database.prepare(`SELECT v.id, p.name_fr, v.sku,
      COALESCE(SUM(m.quantity_delta), 0) AS remaining,
      COALESCE((SELECT url FROM product_media pm WHERE pm.product_id = p.id ORDER BY position LIMIT 1),
        '/image/reign-admin-hoodie.png') AS image
    FROM product_variants v JOIN products p ON p.id = v.product_id
    LEFT JOIN inventory_movements m ON m.variant_id = v.id
    WHERE p.status = 'active' GROUP BY v.id HAVING remaining <= 5 ORDER BY remaining LIMIT 5`)
    .all()) as unknown as Array<{ id: string; name_fr: string; sku: string; remaining: number; image: string }>;
  const sales = (await database.prepare(`SELECT substr(created_at, 1, 10) AS day,
      SUM(total_minor) AS total FROM orders
      WHERE created_at >= ? AND status IN ('paid','preparing','shipped','delivered')
      GROUP BY day ORDER BY day`).all(cutoff)) as unknown as Array<{ day: string; total: number }>;

  return {
    version: 1,
    preferences: { period, sidebarCollapsed: false },
    metrics: [
      { id: 'revenue', label: "Chiffre d'affaires", value: formatEur(summaryVal.revenue), trend: 'Données réelles', positive: true, icon: 'revenue' },
      { id: 'orders', label: 'Commandes', value: String(summaryVal.orders), trend: `${periodDays[period]} jours`, positive: true, icon: 'orders' },
      { id: 'basket', label: 'Panier moyen', value: formatEur(Math.round(summaryVal.basket)), trend: 'Commandes payées', positive: true, icon: 'basket' },
      { id: 'returns', label: 'Retours', value: String(summaryVal.returns), trend: 'Remboursées', positive: summaryVal.returns === 0, icon: 'returns' },
    ],
    recentOrders: recent.map((order) => ({
      id: order.number,
      customer: [order.first_name, order.last_name].filter(Boolean).join(' ') || 'Client invité',
      email: order.email ?? '',
      date: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.created_at)),
      status: statusLabels[order.status] ?? 'En préparation',
      total: formatEur(order.total_minor),
    })),
    stockAlerts: stock.map((item) => ({
      id: item.id, name: item.name_fr, sku: item.sku, remaining: item.remaining, image: item.image,
    })),
    sales: sales.map((point) => ({
      label: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(`${point.day}T12:00:00Z`)),
      sales: point.total / 100,
    })),
  };
}
