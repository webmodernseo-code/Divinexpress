export type DashboardPeriod = '7d' | '30d' | '90d';
export type OrderStatus = 'Payée' | 'Expédiée' | 'En préparation' | 'Annulée';

export interface AdminPreferences { period: DashboardPeriod; sidebarCollapsed: boolean; }
export interface DashboardMetric { id: string; label: string; value: string; trend: string; positive: boolean; icon: 'revenue' | 'orders' | 'basket' | 'returns'; }
export interface RecentOrder { id: string; customer: string; email: string; date: string; status: OrderStatus; total: string; }
export interface StockAlert { id: string; name: string; sku: string; remaining: number; image: string; }
export interface SalesPoint { label: string; sales: number; }
export interface AdminDemoState {
  version: 1;
  preferences: AdminPreferences;
  metrics: DashboardMetric[];
  recentOrders: RecentOrder[];
  stockAlerts: StockAlert[];
  sales: SalesPoint[];
}
