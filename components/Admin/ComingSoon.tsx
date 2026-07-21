// components/Admin/ComingSoon.tsx
import styles from './ComingSoon.module.css';

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>Cette section arrive bientôt.</p>
    </div>
  );
}
