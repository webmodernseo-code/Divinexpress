// components/Admin/DiscountCodeForm.tsx
import styles from './DiscountCodeForm.module.css';

export type DiscountCodeFormValues = {
  code: string;
  type: 'PERCENT' | 'FIXED';
  valueDisplay: string; // '20' for a 20% code, '10.00' for a 10,00€ code
  expiresAt: string; // 'YYYY-MM-DD' or ''
};

export function DiscountCodeForm({
  action,
  initialValues
}: {
  action: (formData: FormData) => Promise<void>;
  initialValues?: DiscountCodeFormValues;
}) {
  return (
    <form action={action} className={styles.form}>
      <label className={styles.label}>
        Code
        <input
          type="text"
          name="code"
          defaultValue={initialValues?.code}
          required
          className={styles.input}
        />
      </label>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Type</legend>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="type"
            value="PERCENT"
            defaultChecked={!initialValues || initialValues.type === 'PERCENT'}
          />
          Pourcentage
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="type"
            value="FIXED"
            defaultChecked={initialValues?.type === 'FIXED'}
          />
          Montant fixe
        </label>
      </fieldset>

      <label className={styles.label}>
        Valeur
        <input
          type="number"
          name="value"
          step="0.01"
          min="0"
          defaultValue={initialValues?.valueDisplay}
          required
          className={styles.input}
        />
        <span className={styles.hint}>Pourcentage (1-100) si Pourcentage, montant en euros si Montant fixe.</span>
      </label>

      <label className={styles.label}>
        Expiration (optionnelle)
        <input
          type="date"
          name="expiresAt"
          defaultValue={initialValues?.expiresAt}
          className={styles.input}
        />
      </label>

      <button type="submit" className={styles.submitButton}>
        Enregistrer
      </button>
    </form>
  );
}
