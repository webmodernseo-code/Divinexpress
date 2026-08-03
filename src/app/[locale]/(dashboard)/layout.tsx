import type { ReactNode } from 'react';
import { AdminDemoProvider } from '@/context/AdminDemoContext';
import { AdminShell } from '@/components/admin/AdminShell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AdminDemoProvider><AdminShell>{children}</AdminShell></AdminDemoProvider>;
}
