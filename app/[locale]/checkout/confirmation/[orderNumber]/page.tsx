import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { Locale } from '@/i18n';
import styles from './page.module.css';

const STATUS_COPY: Record<string, { fr: string; en: string }> = {
  PENDING: {
    fr: 'Paiement en cours de confirmation. Rechargez cette page dans quelques instants.',
    en: 'Payment confirmation pending. Reload this page in a moment.'
  },
  PAID: {
    fr: 'Commande confirmée — merci pour votre achat !',
    en: 'Order confirmed — thank you for your purchase!'
  },
  FULFILLED: {
    fr: 'Commande confirmée — merci pour votre achat !',
    en: 'Order confirmed — thank you for your purchase!'
  },
  CANCELLED: {
    fr: "Le paiement n'a pas abouti. Vous pouvez réessayer depuis votre panier.",
    en: 'Payment did not go through. You can try again from your cart.'
  }
};

export default async function CheckoutConfirmationPage({
  params
}: {
  params: { locale: Locale; orderNumber: string };
}) {
  const order = await prisma.order.findUnique({ where: { orderNumber: params.orderNumber } });
  if (!order) notFound();

  const copy = STATUS_COPY[order.status] ?? STATUS_COPY.PENDING;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{params.locale === 'fr' ? 'Votre commande' : 'Your order'}</h1>
      <p className={styles.orderNumber}>{order.orderNumber}</p>
      <p className={styles.status}>{copy[params.locale]}</p>
    </main>
  );
}
