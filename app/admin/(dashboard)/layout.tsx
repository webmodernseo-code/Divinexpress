import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import styles from './layout.module.css';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
