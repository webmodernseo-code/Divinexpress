import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { OrderStatus } from '@prisma/client';
import { formatEURCents } from '@/lib/adminStats';
import { parsePage, pageHref } from '@/lib/adminPagination';
import styles from './page.module.css';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  FULFILLED: 'Expédiée',
  CANCELLED: 'Annulée'
};

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => urlSearchParams.append(key, v));
    } else if (value !== undefined) {
      urlSearchParams.append(key, value);
    }
  }

  const page = parsePage(urlSearchParams);
  const q = (urlSearchParams.get('q') ?? '').trim();
  const status = urlSearchParams.get('statut') ?? '';

  const where = {
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: 'insensitive' as const } },
            { customerEmail: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {}),
    ...(status ? { status: status as OrderStatus } : {})
  };

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.order.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Commandes</h1>
      </div>

      <form method="get" className={styles.filterBar}>
        <input
          type="text"
          name="q"
          placeholder="Rechercher un n° de commande ou un email"
          defaultValue={q}
          className={styles.input}
        />
        <select name="statut" defaultValue={status} className={styles.select}>
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="PAID">Payée</option>
          <option value="FULFILLED">Expédiée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
        <button type="submit" className={styles.filterButton}>
          Filtrer
        </button>
      </form>

      <div className={styles.tableCard}>
        {orders.length === 0 ? (
          <p className={styles.empty}>Aucune commande ne correspond à ces critères.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° commande</th>
                <th>Date</th>
                <th>Client</th>
                <th>Total</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{formatOrderDate(order.createdAt)}</td>
                  <td>{order.customerEmail}</td>
                  <td>{formatEURCents(order.totalCents)}</td>
                  <td>
                    <span className={styles.statusBadge}>{STATUS_LABELS[order.status]}</span>
                  </td>
                  <td className={styles.actions}>
                    <Link href={`/admin/commandes/${order.id}`} className={styles.actionLink}>
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={pageHref(urlSearchParams, pageNumber)}
              className={pageNumber === page ? styles.pageActive : styles.pageLink}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
