export const MVP_NAVIGATION = [
  { id: 'overview', label: "Vue d'ensemble", href: '/dashboard' },
  { id: 'products', label: 'Produits', href: '/produits' },
  { id: 'orders', label: 'Commandes', href: '/commandes', badgeKey: 'orders' },
  { id: 'settings', label: 'Paramètres', href: '/parametres' },
] as const;

export const MVP_SETTINGS_TABS = [
  'general',
  'paiements',
  'livraison',
  'securite',
] as const;

export type MvpSettingsTab = (typeof MVP_SETTINGS_TABS)[number];
