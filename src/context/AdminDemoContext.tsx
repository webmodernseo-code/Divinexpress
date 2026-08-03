'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createAdminDemoSeed } from '@/lib/admin/demoData';
import { loadAdminDemoState, resetAdminDemoState, saveAdminDemoState } from '@/lib/admin/repository';
import type { AdminDemoState, DashboardPeriod } from '@/lib/admin/types';

interface AdminDemoContextValue {
  state: AdminDemoState;
  ready: boolean;
  setPeriod(period: DashboardPeriod): void;
  setSidebarCollapsed(collapsed: boolean): void;
  reset(): void;
}

const AdminDemoContext = createContext<AdminDemoContextValue | null>(null);

export function AdminDemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminDemoState>(createAdminDemoSeed);
  const [ready, setReady] = useState(false);
  useEffect(() => { setState(loadAdminDemoState()); setReady(true); }, []);
  useEffect(() => { if (ready) saveAdminDemoState(state); }, [ready, state]);
  const updatePreferences = (preferences: Partial<AdminDemoState['preferences']>) => setState((current) => ({ ...current, preferences: { ...current.preferences, ...preferences } }));
  return <AdminDemoContext.Provider value={{ state, ready, setPeriod: (period) => updatePreferences({ period }), setSidebarCollapsed: (sidebarCollapsed) => updatePreferences({ sidebarCollapsed }), reset: () => { resetAdminDemoState(); setState(createAdminDemoSeed()); } }}>{children}</AdminDemoContext.Provider>;
}

export function useAdminDemo() {
  const value = useContext(AdminDemoContext);
  if (!value) throw new Error('useAdminDemo must be used inside AdminDemoProvider');
  return value;
}
