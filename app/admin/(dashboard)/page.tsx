import { prisma } from '@/lib/prisma';
import type { OrderStatus } from '@prisma/client';
import styles from './page.module.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  FULFILLED: 'Expédiée',
  CANCELLED: 'Annulée'
};

export default async function AdminOverviewPage() {
  const [productCount, orderCount, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
  ]);

  return (
    <div>
      <h1 className={styles.title}>Vue d&rsquo;ensemble</h1>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Produits</span>
          <span className={styles.statValue}>{productCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Commandes</span>
          <span className={styles.statValue}>{orderCount}</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h2 className={styles.tableTitle}>Commandes récentes</h2>
        {recentOrders.length === 0 ? (
          <p className={styles.empty}>Aucune commande pour le moment.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Statut</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.customerEmail}</td>
                  <td>{STATUS_LABELS[order.status]}</td>
                  <td>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: order.currency }).format(
                      order.totalCents / 100
                    )}
                  </td>
                  <td>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
