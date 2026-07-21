import { login } from './actions';
import styles from './page.module.css';

export default function AdminLoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const hasError = searchParams.error === '1';

  return (
    <main className={styles.container}>
      <form action={login} className={styles.card}>
        <div className={styles.brand}>
          <svg width="40" height="40" viewBox="0 0 100 100">
            <polygon points="50,3 95,26 95,74 50,97 5,74 5,26" fill="#0c0407" />
            <text x="50" y="62" fontSize="36" fontWeight="800" fill="#ffffff" textAnchor="middle" fontFamily="Inter, sans-serif">
              DX
            </text>
          </svg>
          <span className={styles.brandText}>DIVINEXPRESS</span>
        </div>
        <h1 className={styles.title}>Connexion admin</h1>
        {hasError && <p className={styles.error}>Email ou mot de passe incorrect.</p>}
        <label className={styles.label}>
          Email
          <input type="email" name="email" required autoFocus className={styles.input} />
        </label>
        <label className={styles.label}>
          Mot de passe
          <input type="password" name="password" required className={styles.input} />
        </label>
        <button type="submit" className={styles.submit}>
          Se connecter
        </button>
      </form>
    </main>
  );
}
