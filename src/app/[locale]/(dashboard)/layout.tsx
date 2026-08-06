import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AdminDemoProvider } from '@/context/AdminDemoContext';
import { AdminShell } from '@/components/admin/AdminShell';
import { getCurrentAdmin } from '@/server/auth/runtime';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, admin] = await Promise.all([params, getCurrentAdmin()]);
  if (!admin) redirect(`/${locale === 'en' ? 'en' : 'fr'}/connexion`);
  return <AdminDemoProvider><AdminShell>{children}</AdminShell></AdminDemoProvider>;
}
