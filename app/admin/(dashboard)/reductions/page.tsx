import Link from 'next/link';
import type { DiscountType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatEURCents } from '@/lib/adminStats';
import { toggleDiscountCodeActive, deleteDiscountCode } from './actions';
import styles from './page.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  'code-requis': 'Merci de renseigner un code.',
  'valeur-invalide': 'Merci de renseigner une valeur valide (1-100 pour un pourcentage, un montant positif pour un montant fixe).',
  'code-deja-utilise': 'Ce code existe déjà.'
};

function formatValue(type: DiscountType, value: number): string {
  return type === 'PERCENT' ? `${value}%` : formatEURCents(value);
}

function formatExpiresAt(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default async function AdminDiscountsPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : undefined;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Réductions</h1>
        <Link href="/admin/reductions/nouveau" className={styles.addLink}>
          + Nouveau code
        </Link>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Valeur</th>
              <th>Expiration</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((discountCode) => (
              <tr key={discountCode.id}>
                <td>{discountCode.code}</td>
                <td>{discountCode.type === 'PERCENT' ? 'Pourcentage' : 'Montant fixe'}</td>
                <td>{formatValue(discountCode.type, discountCode.value)}</td>
                <td>{formatExpiresAt(discountCode.expiresAt)}</td>
                <td>
                  <span className={discountCode.isActive ? styles.badgeActive : styles.badgeInactive}>
                    {discountCode.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <Link href={`/admin/reductions/${discountCode.id}`} className={styles.actionLink}>
                    Modifier
                  </Link>
                  <form action={toggleDiscountCodeActive.bind(null, discountCode.id)}>
                    <button type="submit" className={styles.actionButton}>
                      {discountCode.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </form>
                  <form action={deleteDiscountCode.bind(null, discountCode.id)}>
                    <button type="submit" className={styles.deleteButton}>
                      Supprimer
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
