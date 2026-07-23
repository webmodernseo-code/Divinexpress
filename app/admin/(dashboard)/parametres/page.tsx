import Link from 'next/link';
import styles from './page.module.css';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className={styles.title}>Paramètres</h1>
      <Link href="/admin/parametres/livraison" className={styles.card}>
        <h2 className={styles.cardTitle}>Livraison</h2>
        <p className={styles.cardText}>Gérer les frais de livraison par zone.</p>
      </Link>
      <p className={styles.message}>Les autres réglages arrivent bientôt.</p>
    </div>
  );
}
