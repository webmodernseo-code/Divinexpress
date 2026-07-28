'use client';

import React, { useState } from 'react';
import {
  adminLogout,
  updateOrderStatus,
  updateProductStock,
  createPromoCode,
  togglePromoCode
} from '@/app/admin/actions';

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  shippingAddr: string;
  status: string;
  totalCents: number;
  paymentMethod: string;
  createdAt: string;
}

interface Variant {
  id: string;
  sku: string;
  size: string;
  color: string;
  priceCents: number;
  stock: number;
}

interface Image {
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  variants: Variant[];
  images: Image[];
}

interface Promo {
  id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
}

interface DashboardClientProps {
  initialOrders: Order[];
  initialProducts: Product[];
  initialPromos: Promo[];
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  initialOrders,
  initialProducts,
  initialPromos
}) => {
  const [activePanel, setActivePanel] = useState<string>('panel-dashboard');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [promos, setPromos] = useState<Promo[]>(initialPromos);

  // New Promo state
  const [newPromoCode, setNewPromoCode] = useState<string>('');
  const [newPromoType, setNewPromoType] = useState<string>('percent');
  const [newPromoValue, setNewPromoValue] = useState<number>(0);

  // Edit stock state
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<number>(0);

  // Header Dropdown state
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  const handleLogout = async () => {
    await adminLogout();
    window.location.href = '/admin/login';
  };

  // KPIs
  const totalSales = orders.length;
  const revenueCents = orders
    .filter((o) => o.status === 'PAID' || o.status === 'FULFILLED')
    .reduce((acc, o) => acc + o.totalCents, 0);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    const success = await updateOrderStatus(orderId, status);
    if (success.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    }
  };

  const handleStockUpdateSubmit = async (variantId: string) => {
    const success = await updateProductStock(variantId, editingStockVal);
    if (success.success) {
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          variants: p.variants.map((v) =>
            v.id === variantId ? { ...v, stock: editingStockVal } : v
          )
        }))
      );
      setEditingVariantId(null);
    }
  };

  const handleCreatePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode || newPromoValue <= 0) return;
    const result = await createPromoCode(newPromoCode, newPromoType, newPromoValue);
    if (result.success) {
      // Reload page or insert locally
      setPromos((prev) => [
        {
          id: Math.random().toString(),
          code: newPromoCode.toUpperCase(),
          type: newPromoType.toUpperCase(),
          value: newPromoValue,
          isActive: true
        },
        ...prev
      ]);
      setNewPromoCode('');
      setNewPromoValue(0);
    }
  };

  const handleTogglePromo = async (promoId: string, currentActive: boolean) => {
    const result = await togglePromoCode(promoId, !currentActive);
    if (result.success) {
      setPromos((prev) =>
        prev.map((p) => (p.id === promoId ? { ...p, isActive: !currentActive } : p))
      );
    }
  };

  return (
    <div className="app-container">
      {/* Top Nav */}
      <header className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg viewBox="0 0 32 32" width="28" height="28" className="brand-mark">
            <rect width="32" height="32" rx="9" fill="#0f172a" />
            <path d="M10 9h6c3.866 0 7 3.134 7 7s-3.134 7-7 7h-6V9zm2 2v10h4c2.761 0 5-2.239 5-5s-2.239-5-5-5h-4z" fill="#ffffff" />
          </svg>
          <span className="top-nav-logo-text">DivinExpress</span>
        </div>

        <nav className="nav-tabs">
          <button
            onClick={() => setActivePanel('panel-dashboard')}
            className={`nav-item ${activePanel === 'panel-dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActivePanel('panel-products')}
            className={`nav-item ${activePanel === 'panel-products' ? 'active' : ''}`}
          >
            Produits
          </button>
          <button
            onClick={() => setActivePanel('panel-orders')}
            className={`nav-item ${activePanel === 'panel-orders' ? 'active' : ''}`}
          >
            Commandes
          </button>
          <button
            onClick={() => setActivePanel('panel-promos')}
            className={`nav-item ${activePanel === 'panel-promos' ? 'active' : ''}`}
          >
            Promotions
          </button>
        </nav>

        <div className="top-nav-actions" style={{ position: 'relative' }}>
          <div
            className="nav-user"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar">A</div>
            <div className="user-info">
              <span className="user-name">Administrateur</span>
              <span className="user-role">Super Admin</span>
            </div>
            {userDropdownOpen && (
              <div
                className="nav-user-dropdown"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  borderRadius: 8,
                  padding: 8,
                  zIndex: 10,
                  marginTop: 8
                }}
              >
                <button
                  type="button"
                  className="nav-user-dropdown-item"
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="main-workspace">
        {/* PANEL 1: DASHBOARD */}
        {activePanel === 'panel-dashboard' && (
          <div className="workspace-panel active">
            <div className="panel-header">
              <div>
                <h2>Bonjour, Administrateur 👋</h2>
                <p>Gérez produits, commandes, clients et performance en un seul endroit.</p>
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div>
                  <span className="metric-title">Ventes Totales</span>
                  <div className="metric-value">{totalSales}</div>
                </div>
              </div>
              <div className="metric-card">
                <div>
                  <span className="metric-title">Chiffre d'Affaires</span>
                  <div className="metric-value">{formatPrice(revenueCents)}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32 }}>
              <div className="content-card">
                <div className="content-card-header">
                  <h3>Commandes Récentes</h3>
                </div>
                <div className="content-card-body">
                  <table>
                    <thead>
                      <tr>
                        <th>N° Commande</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Moyen de paiement</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id}>
                          <td>{o.orderNumber}</td>
                          <td>{o.customerEmail}</td>
                          <td>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td>{formatPrice(o.totalCents)}</td>
                          <td>{o.paymentMethod}</td>
                          <td>{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: PRODUCTS CATALOGUE */}
        {activePanel === 'panel-products' && (
          <div className="workspace-panel active">
            <div className="panel-header">
              <h2>Gestion du Catalogue</h2>
              <p>Mettez à jour les niveaux de stock par variante.</p>
            </div>

            <div className="content-card">
              <div className="content-card-header">
                <h3>État des Stocks</h3>
              </div>
              <div className="content-card-body">
                <table>
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>SKU</th>
                      <th>Taille</th>
                      <th>Couleur</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) =>
                      p.variants.map((v) => (
                        <tr key={v.id}>
                          <td>{p.name}</td>
                          <td>{v.sku}</td>
                          <td>{v.size}</td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                backgroundColor: v.color,
                                border: '1px solid #ccc'
                              }}
                            ></span>
                          </td>
                          <td>
                            {editingVariantId === v.id ? (
                              <input
                                type="number"
                                value={editingStockVal}
                                onChange={(e) => setEditingStockVal(Number(e.target.value))}
                                style={{ width: 60, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc' }}
                              />
                            ) : (
                              v.stock
                            )}
                          </td>
                          <td>
                            {editingVariantId === v.id ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="btn-primary"
                                  onClick={() => handleStockUpdateSubmit(v.id)}
                                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                >
                                  Sauver
                                </button>
                                <button
                                  className="btn-secondary"
                                  onClick={() => setEditingVariantId(null)}
                                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <button
                                className="btn-secondary"
                                onClick={() => {
                                  setEditingVariantId(v.id);
                                  setEditingStockVal(v.stock);
                                }}
                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              >
                                Modifier Stock
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 3: ORDERS */}
        {activePanel === 'panel-orders' && (
          <div className="workspace-panel active">
            <div className="panel-header">
              <h2>Commandes</h2>
              <p>Suivi et mise à jour du statut des commandes clients.</p>
            </div>

            <div className="content-card">
              <div className="content-card-body">
                <table>
                  <thead>
                    <tr>
                      <th>N° Commande</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Moyen</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.orderNumber}</td>
                        <td>{o.customerEmail}</td>
                        <td>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td>{formatPrice(o.totalCents)}</td>
                        <td>{o.paymentMethod}</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{o.status}</span>
                        </td>
                        <td>
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '8px',
                              border: '1px solid #ccc',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PAID">PAID</option>
                            <option value="FULFILLED">FULFILLED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 4: PROMOTIONS */}
        {activePanel === 'panel-promos' && (
          <div className="workspace-panel active">
            <div className="panel-header">
              <h2>Gestion des Codes Promo</h2>
              <p>Créez, activez et désactivez des codes de réduction applicables lors du paiement.</p>
            </div>

            <div className="panel-grid-2">
              {/* Form */}
              <div className="content-card">
                <div className="content-card-header">
                  <h3>Nouveau Code Promo</h3>
                </div>
                <form className="content-card-body" onSubmit={handleCreatePromoSubmit}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>Code de Réduction*</label>
                    <input
                      type="text"
                      placeholder="Ex: SPECIAL20"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value)}
                      required
                      style={{ textTransform: 'uppercase', width: '100%', height: 38, borderRadius: 8, border: '1px solid #ccc', padding: '0 12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>Type*</label>
                    <select
                      value={newPromoType}
                      onChange={(e) => setNewPromoType(e.target.value)}
                      style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid #ccc', padding: '0 12px' }}
                    >
                      <option value="percent">Pourcentage (%)</option>
                      <option value="fixed">Montant Fixe</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label>Valeur*</label>
                    <input
                      type="number"
                      value={newPromoValue}
                      onChange={(e) => setNewPromoValue(Number(e.target.value))}
                      required
                      style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid #ccc', padding: '0 12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button className="btn-primary" type="submit" style={{ width: '100%' }}>
                    Enregistrer
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="content-card">
                <div className="content-card-header">
                  <h3>Codes Promo Actifs</h3>
                </div>
                <div className="content-card-body">
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Valeur</th>
                        <th>Statut</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promos.map((p) => (
                        <tr key={p.id}>
                          <td>{p.code}</td>
                          <td>{p.type}</td>
                          <td>{p.value}</td>
                          <td>{p.isActive ? 'Actif' : 'Inactif'}</td>
                          <td>
                            <button
                              className="btn-secondary"
                              onClick={() => handleTogglePromo(p.id, p.isActive)}
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              {p.isActive ? 'Désactiver' : 'Activer'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
