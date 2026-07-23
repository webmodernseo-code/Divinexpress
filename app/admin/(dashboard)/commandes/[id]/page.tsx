import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { OrderStatus, PaymentStatus } from '@prisma/client';
import { formatEURCents } from '@/lib/adminStats';
import { markOrderFulfilled, cancelOrder } from './actions';
import styles from './page.module.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  FULFILLED: 'Expédiée',
  CANCELLED: 'Annulée'
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'En attente',
  SUCCEEDED: 'Réussi',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé'
};

const ERROR_MESSAGES: Record<string, string> = {
  'transition-invalide':
    "Cette commande ne peut plus être modifiée dans cet état — la page a peut-être été rechargée après une autre action."
};

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default async function AdminOrderDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      payment: true
    }
  });

  if (!order) notFound();

  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : undefined;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{order.orderNumber}</h1>
          <p className={styles.subtitle}>{formatOrderDate(order.createdAt)}</p>
        </div>
        <span className={styles.statusBadge}>{STATUS_LABELS[order.status]}</span>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.actions}>
        {order.status === 'PAID' && (
          <form action={markOrderFulfilled.bind(null, order.id)}>
            <button type="submit" className={styles.actionButton}>
              Marquer comme Expédiée
            </button>
          </form>
        )}
        {(order.status === 'PENDING' || order.status === 'PAID') && (
          <form action={cancelOrder.bind(null, order.id)}>
            <button type="submit" className={styles.actionButtonDanger}>
              Annuler la commande
            </button>
          </form>
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Articles</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Taille</th>
              <th>Couleur</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.variant.product.nameFr}</td>
                <td>{item.variant.size}</td>
                <td>{item.variant.color}</td>
                <td>{item.quantity}</td>
                <td>{formatEURCents(item.unitPriceCents)}</td>
                <td>{formatEURCents(item.unitPriceCents * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.totalRow}>
          <span>Total commande</span>
          <span>{formatEURCents(order.totalCents)}</span>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Livraison</h2>
        <p className={styles.infoLine}>{order.shippingAddr}</p>
        <p className={styles.infoLine}>{order.country}</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Client</h2>
        <p className={styles.infoLine}>{order.customerEmail}</p>
      </div>

      {order.payment && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Paiement</h2>
          <p className={styles.infoLine}>Fournisseur : {order.payment.provider}</p>
          <p className={styles.infoLine}>Référence : {order.payment.reference}</p>
          <p className={styles.infoLine}>Statut : {PAYMENT_STATUS_LABELS[order.payment.status]}</p>
          <p className={styles.infoLine}>
            Montant : {new Intl.NumberFormat('fr-FR').format(order.payment.amountCents)} {order.payment.currency}
          </p>
        </div>
      )}
    </div>
  );
}
