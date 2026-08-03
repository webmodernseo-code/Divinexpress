import type { AdminDemoState } from './types';

export const ADMIN_DEMO_SEED: AdminDemoState = {
  version: 1,
  preferences: { period: '30d', sidebarCollapsed: false },
  metrics: [
    { id: 'revenue', label: "Chiffre d'affaires", value: '18 420 €', trend: '+12,4 %', positive: true, icon: 'revenue' },
    { id: 'orders', label: 'Commandes', value: '284', trend: '+8,2 %', positive: true, icon: 'orders' },
    { id: 'basket', label: 'Panier moyen', value: '64,86 €', trend: '+3,1 %', positive: true, icon: 'basket' },
    { id: 'returns', label: 'Retours', value: '8', trend: '-1,8 %', positive: false, icon: 'returns' },
  ],
  recentOrders: [
    { id: 'RG-2841', customer: 'Alice Martin', email: 'alice.martin@email.com', date: '30 mai 2026, 10:24', status: 'Payée', total: '136,00 €' },
    { id: 'RG-2840', customer: 'Lucas Bernard', email: 'lucas.bernard@email.com', date: '30 mai 2026, 09:15', status: 'Expédiée', total: '89,90 €' },
    { id: 'RG-2839', customer: 'Chloé Dubois', email: 'chloe.dubois@email.com', date: '29 mai 2026, 18:47', status: 'En préparation', total: '64,50 €' },
    { id: 'RG-2838', customer: 'Thomas Leroy', email: 'thomas.leroy@email.com', date: '29 mai 2026, 14:22', status: 'Payée', total: '49,00 €' },
    { id: 'RG-2837', customer: 'Emma Richard', email: 'emma.richard@email.com', date: '28 mai 2026, 11:03', status: 'Annulée', total: '110,00 €' },
  ],
  stockAlerts: [
    { id: 'hoodie', name: 'Fleece hoodie noir XL', sku: 'RG-FH-BLK-XL', remaining: 3, image: '/image/image projet/hommes/men_hoodie_grey.png' },
    { id: 'tee', name: 'Oversized tee blanc M', sku: 'RG-OT-WHT-M', remaining: 5, image: '/image/image projet/hommes/men_tshirt_white.png' },
  ],
  sales: [
    { label: '23 avr.', sales: 1080 }, { label: '26 avr.', sales: 1320 }, { label: '30 avr.', sales: 660 },
    { label: '7 mai', sales: 1280 }, { label: '14 mai', sales: 720 }, { label: '18 mai', sales: 1540 },
    { label: '21 mai', sales: 1210 }, { label: '25 mai', sales: 1760 }, { label: '28 mai', sales: 1260 }, { label: '30 mai', sales: 1430 },
  ],
};

export function createAdminDemoSeed(): AdminDemoState {
  return JSON.parse(JSON.stringify(ADMIN_DEMO_SEED)) as AdminDemoState;
}
