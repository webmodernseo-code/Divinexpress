import { DiscountCodeForm } from '@/components/Admin/DiscountCodeForm';
import { createDiscountCode } from '../actions';
import styles from '../page.module.css';

export default function NewDiscountCodePage() {
  return (
    <div>
      <h1 className={styles.title}>Nouveau code promo</h1>
      <DiscountCodeForm action={createDiscountCode} />
    </div>
  );
}
