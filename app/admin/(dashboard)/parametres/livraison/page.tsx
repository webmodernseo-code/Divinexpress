import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { updateShippingZoneCost } from './actions';
import styles from './page.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  'cout-invalide': 'Merci de renseigner un coût valide (nombre positif).'
};

export default async function AdminShippingPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const zones = await prisma.shippingZone.findMany({ orderBy: { carrier: 'asc' } });
  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : undefined;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Livraison</h1>
        <Link href="/admin/parametres" className={styles.backLink}>
          ← Retour aux paramètres
        </Link>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pays</th>
              <th>Transporteur</th>
              <th>Délai</th>
              <th>Coût</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id}>
                <td>{zone.countries.join(', ')}</td>
                <td>{zone.carrier}</td>
                <td>{zone.etaDays} jours</td>
                <td>
                  <form action={updateShippingZoneCost.bind(null, zone.id)} className={styles.editForm}>
                    <input
                      type="number"
                      name="costEuros"
                      step="0.01"
                      min="0"
                      defaultValue={(zone.costCents / 100).toFixed(2)}
                      className={styles.inlineInput}
                    />
                    <span className={styles.currencyLabel}>€</span>
                    <button type="submit" className={styles.saveButton}>
                      Enregistrer
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
