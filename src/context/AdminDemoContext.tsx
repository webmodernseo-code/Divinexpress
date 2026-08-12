'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminDemoState, DashboardPeriod } from '@/lib/admin/types';

interface AdminDemoContextValue {
  state: AdminDemoState;
  ready: boolean;
  setPeriod(period: DashboardPeriod): void;
  setSidebarCollapsed(collapsed: boolean): void;
}

const AdminDemoContext = createContext<AdminDemoContextValue | null>(null);

export function AdminDemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminDemoState>({
    version: 1,
    preferences: { period: '30d', sidebarCollapsed: false },
    metrics: [], recentOrders: [], stockAlerts: [], sales: [],
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    fetch(`/api/admin/dashboard?period=${state.preferences.period}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('dashboard unavailable')))
      .then((server: AdminDemoState) => setState((current) => ({
        ...server,
        preferences: current.preferences,
      })))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [state.preferences.period]);
  const updatePreferences = (preferences: Partial<AdminDemoState['preferences']>) => setState((current) => ({ ...current, preferences: { ...current.preferences, ...preferences } }));
  return <AdminDemoContext.Provider value={{ state, ready, setPeriod: (period) => updatePreferences({ period }), setSidebarCollapsed: (sidebarCollapsed) => updatePreferences({ sidebarCollapsed }) }}>{children}</AdminDemoContext.Provider>;
}

export function useAdminDemo() {
  const value = useContext(AdminDemoContext);
  if (!value) throw new Error('useAdminDemo must be used inside AdminDemoProvider');
  return value;
}
