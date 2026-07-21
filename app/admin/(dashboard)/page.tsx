// app/admin/(dashboard)/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { OrderStatus } from '@prisma/client';
import { getCurrentAdmin } from '@/lib/currentAdmin';
import { percentChange, bucketOrdersByDay, dayRange } from '@/lib/adminStats';
import { buildActivityFeed, formatRelativeTime } from '@/lib/adminActivity';
import { RevenueChart } from '@/components/Admin/RevenueChart';
import styles from './page.module.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  FULFILLED: 'Expédiée',
  CANCELLED: 'Annulée'
};

const CHART_DAYS = 14;

function formatEUR(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default async function AdminOverviewPage() {
  const today = dayRange(0);
  const yesterday = dayRange(1);
  const chartStart = dayRange(CHART_DAYS - 1).start;
  const last30DaysStart = dayRange(29).start;

  const [
    admin,
    todayOrders,
    yesterdayOrders,
    last30DaysOrders,
    pendingCount,
    last14DaysOrders,
    lowStockVariants,
    recentOrders,
    recentProducts
  ] = await Promise.all([
    getCurrentAdmin(),
    prisma.order.findMany({
      where: { currency: 'EUR', createdAt: { gte: today.start, lt: today.end } },
      select: { totalCents: true }
    }),
    prisma.order.findMany({
      where: { currency: 'EUR', createdAt: { gte: yesterday.start, lt: yesterday.end } },
      select: { totalCents: true }
    }),
    prisma.order.findMany({
      where: { currency: 'EUR', createdAt: { gte: last30DaysStart } },
      select: { totalCents: true }
    }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.findMany({
      where: { currency: 'EUR', createdAt: { gte: chartStart } },
      select: { totalCents: true, createdAt: true }
    }),
    prisma.productVariant.findMany({
      where: { stock: { lt: 10 } },
      orderBy: { stock: 'asc' },
      take: 5,
      include: { product: true }
    }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 3 })
  ]);

  const salesTodayCents = todayOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const salesYesterdayCents = yesterdayOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const salesChange = percentChange(salesTodayCents, salesYesterdayCents);

  const avgCartCents =
    last30DaysOrders.length > 0
      ? Math.round(last30DaysOrders.reduce((sum, o) => sum + o.totalCents, 0) / last30DaysOrders.length)
      : null;

  const chartData = bucketOrdersByDay(last14DaysOrders, CHART_DAYS);
  const chartTotalCents = chartData.reduce((sum, b) => sum + b.totalCents, 0);

  const activityFeed = buildActivityFeed(
    recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      currency: o.currency
    })),
    recentProducts.map((p) => ({ id: p.id, nameFr: p.nameFr, createdAt: p.createdAt })),
    5
  );

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bonjour {admin?.name ?? 'DivinExpress'} 👋</h1>
          <p className={styles.subtitle}>Voici ce qui se passe avec votre boutique aujourd&rsquo;hui.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/produits" className={styles.secondaryButton}>
            Voir les produits
          </Link>
          <Link href="/admin/produits" className={styles.primaryButton}>
            Ajouter un produit
          </Link>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Link href="/admin/produits" className={styles.quickAction}>
          <span className={`${styles.quickIcon} ${styles.iconPurple}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8l9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
            </svg>
          </span>
          <span className={styles.quickText}>
            <span className={styles.quickTitle}>Ajouter des produits</span>
            <span className={styles.quickDesc}>Créez vos fiches produit et gérez votre stock.</span>
          </span>
        </Link>
        <Link href="/admin/reductions" className={styles.quickAction}>
          <span className={`${styles.quickIcon} ${styles.iconOrange}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0l-7.4-7.4a2 2 0 0 1 0-2.8L10.4 2.4a2 2 0 0 1 1.4-.4H19a2 2 0 0 1 2 2v6.8a2 2 0 0 1-.4 1.4zM15 8h.01" />
            </svg>
          </span>
          <span className={styles.quickText}>
            <span className={styles.quickTitle}>Créer une réduction</span>
            <span className={styles.quickDesc}>Lancez un code promo pour vos clients.</span>
          </span>
        </Link>
        <Link href="/admin/commandes" className={styles.quickAction}>
          <span className={`${styles.quickIcon} ${styles.iconGreen}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
          <span className={styles.quickText}>
            <span className={styles.quickTitle}>Traiter les commandes</span>
            <span className={styles.quickDesc}>Expédiez et suivez les commandes en cours.</span>
          </span>
        </Link>
        <Link href="/admin/blog" className={styles.quickAction}>
          <span className={`${styles.quickIcon} ${styles.iconBlue}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6" />
            </svg>
          </span>
          <span className={styles.quickText}>
            <span className={styles.quickTitle}>Publier un article</span>
            <span className={styles.quickDesc}>Rédigez du contenu pour le blog DivinExpress.</span>
          </span>
        </Link>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconPurple}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <span className={styles.statLabel}>Ventes aujourd&rsquo;hui</span>
          <span className={styles.statValue}>{formatEUR(salesTodayCents)}</span>
          <span className={styles.statMeta}>
            {salesChange === null ? '—' : `${salesChange >= 0 ? '↗' : '↘'} ${Math.abs(salesChange).toFixed(1)}%`} vs hier
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconOrange}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0l-7.4-7.4a2 2 0 0 1 0-2.8L10.4 2.4a2 2 0 0 1 1.4-.4H19a2 2 0 0 1 2 2v6.8a2 2 0 0 1-.4 1.4zM15 8h.01" />
            </svg>
          </span>
          <span className={styles.statLabel}>Commandes à traiter</span>
          <span className={styles.statValue}>{pendingCount}</span>
          <span className={styles.statMeta}>À expédier</span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconGreen}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
          <span className={styles.statLabel}>Panier moyen</span>
          <span className={styles.statValue}>{avgCartCents === null ? '—' : formatEUR(avgCartCents)}</span>
          <span className={styles.statMeta}>30 derniers jours</span>
        </div>
      </div>

      <div className={styles.chartRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Chiffre d&rsquo;affaires</h2>
            <div className={styles.chartPeriods}>
              <span className={`${styles.periodPill} ${styles.periodActive}`}>14 jours</span>
              <span className={styles.periodPill}>3 mois</span>
              <span className={styles.periodPill}>12 mois</span>
            </div>
          </div>
          <div className={styles.chartTotal}>
            <span className={styles.chartTotalValue}>{formatEUR(chartTotalCents)}</span>
            <span className={styles.chartTotalLabel}>sur les 14 derniers jours</span>
          </div>
          <RevenueChart data={chartData} />
        </div>

        <div className={styles.sidePanels}>
          <div className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Stock faible</h2>
            {lowStockVariants.length === 0 ? (
              <p className={styles.empty}>Aucune variante en stock faible.</p>
            ) : (
              <ul className={styles.stockList}>
                {lowStockVariants.map((variant) => (
                  <li key={variant.id} className={styles.stockItem}>
                    <span className={styles.stockName}>
                      {variant.product.nameFr}
                      <span className={styles.stockMeta}>
                        {variant.size} · {variant.color}
                      </span>
                    </span>
                    <span className={styles.stockBadge}>
                      {variant.stock} restant{variant.stock > 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Activité récente</h2>
            {activityFeed.length === 0 ? (
              <p className={styles.empty}>Aucune activité récente.</p>
            ) : (
              <ul className={styles.activityList}>
                {activityFeed.map((item) => (
                  <li key={item.id} className={styles.activityItem}>
                    <span className={styles.activityLabel}>{item.label}</span>
                    <span className={styles.activityTime}>{formatRelativeTime(item.createdAt)}</span>
                    {item.amountCents !== undefined && (
                      <span className={styles.activityAmount}>
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: item.currency ?? 'EUR'
                        }).format(item.amountCents / 100)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
