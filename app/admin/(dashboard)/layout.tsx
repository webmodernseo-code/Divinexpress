// app/admin/(dashboard)/layout.tsx
import { getCurrentAdmin } from '@/lib/currentAdmin';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import { AdminTopbar } from '@/components/Admin/AdminTopbar';
import styles from './layout.module.css';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <div className={styles.main}>
        <AdminTopbar name={admin?.name ?? null} email={admin?.email ?? ''} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
