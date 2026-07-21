export interface ActivityItem {
  id: string;
  type: 'order' | 'product';
  label: string;
  createdAt: Date;
  amountCents?: number;
}

export function buildActivityFeed(
  recentOrders: { id: string; orderNumber: string; totalCents: number; createdAt: Date }[],
  recentProducts: { id: string; nameFr: string; createdAt: Date }[],
  limit: number
): ActivityItem[] {
  const orderItems: ActivityItem[] = recentOrders.map((o) => ({
    id: o.id,
    type: 'order',
    label: `Nouvelle commande ${o.orderNumber}`,
    createdAt: o.createdAt,
    amountCents: o.totalCents
  }));
  const productItems: ActivityItem[] = recentProducts.map((p) => ({
    id: p.id,
    type: 'product',
    label: `Produit ajouté : ${p.nameFr}`,
    createdAt: p.createdAt
  }));
  return [...orderItems, ...productItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}
