'use client';

/* eslint-disable react/no-unescaped-entities */

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { 
  Search, 
  Plus, 
  Upload, 
  SlidersHorizontal,
  Mail,
  Truck,
  RotateCcw,
  FileText,
  Package
} from 'lucide-react';
import Image from 'next/image';

type OrderItem = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  shippingMethod: string;
  trackingNumber: string;
  date: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  deliveryStatus: 'delivered' | 'shipping' | 'preparing' | 'pending';
  itemsCount: number;
  total: number;
  productName: string;
  productSku: string;
  productVariant: string;
  productQty: number;
  productImage: string;
  returnReason?: string;
  returnStatus?: 'none' | 'requested' | 'received';
};

const INITIAL_ORDERS: OrderItem[] = [
  { 
    id: '#RG-2841', 
    customer: 'Alice Martin', 
    email: 'alice.martin@email.com', 
    phone: '+33 6 12 34 56 78',
    address: '12 rue des Lilas, 75011 Paris, France',
    shippingMethod: 'Colissimo Domicile (Livraison en 2 à 3 jours)',
    trackingNumber: '6A1234567890',
    date: '30 mai 2026 10:42', 
    paymentStatus: 'paid', 
    deliveryStatus: 'preparing',
    itemsCount: 2,
    total: 136.00,
    productName: 'Fleece hoodie',
    productSku: 'RG-FH-BLK-XL',
    productVariant: 'XL · Noir',
    productQty: 2,
    productImage: '/images/products/fleece-hoodie-black.jpg'
  },
  { 
    id: '#RG-2840', 
    customer: 'Lucas Bernard', 
    email: 'lucas.b@gmail.com', 
    phone: '+33 6 98 76 54 32',
    address: '45 avenue Foch, 69006 Lyon, France',
    shippingMethod: 'Chronopost Express (Livraison en 24h)',
    trackingNumber: 'XP987654321FR',
    date: '30 mai 2026 09:15', 
    paymentStatus: 'paid', 
    deliveryStatus: 'shipping',
    itemsCount: 1,
    total: 89.00,
    productName: 'Classic T-Shirt',
    productSku: 'RG-TS-WHT-M',
    productVariant: 'M · Blanc',
    productQty: 1,
    productImage: '/image/category_femme.png'
  },
  { 
    id: '#RG-2839', 
    customer: 'Chloé Dubois', 
    email: 'chloe.dubois@email.com', 
    phone: '+33 7 45 67 89 01',
    address: '8 rue de la Paix, 75002 Paris, France',
    shippingMethod: 'Colissimo Domicile',
    trackingNumber: '6A9876543210',
    date: '29 mai 2026 16:30', 
    paymentStatus: 'refunded', 
    deliveryStatus: 'delivered',
    itemsCount: 1,
    total: 98.00,
    productName: 'Sweat à capuche Fleece',
    productSku: 'RG-FH-GRY-L',
    productVariant: 'L · Gris',
    productQty: 1,
    productImage: '/image/category_homme.png',
    returnReason: 'Taille trop grande',
    returnStatus: 'received'
  },
  { 
    id: '#RG-2838', 
    customer: 'Thomas Leroy', 
    email: 'thomas.l@gmail.com', 
    phone: '+33 6 32 14 58 79',
    address: '14 boulevard Haussmann, 75009 Paris, France',
    shippingMethod: 'Colissimo Domicile',
    trackingNumber: '6A8541257410',
    date: '29 mai 2026 11:05', 
    paymentStatus: 'failed', 
    deliveryStatus: 'pending',
    itemsCount: 1,
    total: 59.00,
    productName: 'Leather Wallet',
    productSku: 'RG-LW-BRN',
    productVariant: 'Unique · Marron',
    productQty: 1,
    productImage: '/image/category_accessoires.png'
  },
  { 
    id: '#RG-2837', 
    customer: 'Emma Petit', 
    email: 'emma.p@gmail.com', 
    phone: '+33 6 45 12 78 96',
    address: '22 rue des Écoles, 75005 Paris, France',
    shippingMethod: 'Colissimo Domicile',
    trackingNumber: '6A9512547841',
    date: '28 mai 2026 18:20', 
    paymentStatus: 'paid', 
    deliveryStatus: 'preparing',
    itemsCount: 3,
    total: 165.00,
    productName: 'Classic T-Shirt',
    productSku: 'RG-TS-BLK-S',
    productVariant: 'S · Noir',
    productQty: 3,
    productImage: '/image/category_femme.png'
  }
];

export default function CommandesPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('#RG-2841');
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'todo' | 'preparing' | 'shipping' | 'returns'>('all');

  const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.customer.toLowerCase().includes(search.toLowerCase()) || 
      o.id.toLowerCase().includes(search.toLowerCase());
      
    if (statusTab === 'all') return matchesSearch;
    if (statusTab === 'todo') return matchesSearch && o.deliveryStatus === 'pending';
    if (statusTab === 'preparing') return matchesSearch && o.deliveryStatus === 'preparing';
    if (statusTab === 'shipping') return matchesSearch && o.deliveryStatus === 'shipping';
    if (statusTab === 'returns') return matchesSearch && o.paymentStatus === 'refunded';
    return matchesSearch;
  });

  const getPaymentBadge = (status: OrderItem['paymentStatus']) => {
    const config = {
      paid: { bg: 'bg-green-50 text-[#247A52] border-green-150', label: systemLocale === 'fr' ? 'Payée' : 'Paid' },
      pending: { bg: 'bg-amber-50 text-[#B76A16] border-amber-150', label: systemLocale === 'fr' ? 'En attente' : 'Pending' },
      failed: { bg: 'bg-red-50 text-[#B53A35] border-red-150', label: systemLocale === 'fr' ? 'Échec' : 'Failed' },
      refunded: { bg: 'bg-purple-50 text-purple-700 border-purple-100', label: systemLocale === 'fr' ? 'Remboursée' : 'Refunded' }
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${config[status].bg}`}>
        {config[status].label}
      </span>
    );
  };

  const getDeliveryBadge = (status: OrderItem['deliveryStatus']) => {
    const config = {
      delivered: { bg: 'bg-neutral-50 text-neutral-500 border-neutral-200', label: systemLocale === 'fr' ? 'Livré' : 'Delivered' },
      shipping: { bg: 'bg-blue-50 text-blue-700 border-blue-100', label: systemLocale === 'fr' ? 'Expédiée' : 'Shipped' },
      preparing: { bg: 'bg-amber-50 text-amber-700 border-amber-100', label: systemLocale === 'fr' ? 'À préparer' : 'To prepare' },
      pending: { bg: 'bg-neutral-50 text-neutral-400 border-neutral-100', label: systemLocale === 'fr' ? 'Non traitée' : 'Pending' }
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${config[status].bg}`}>
        {config[status].label}
      </span>
    );
  };

  const handleCreateShipment = (id: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, deliveryStatus: 'shipping' } : o));
  };

  const handleRefund = (id: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, paymentStatus: 'refunded' } : o));
  };

  return (
    <div className="space-y-6 animate-fade-in text-admin-text font-sans">
      
      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            {systemLocale === 'fr' ? 'Commandes et retours' : 'Orders & Returns'}
          </h1>
          <p className="text-sm text-admin-muted mt-1.5 font-medium">
            {systemLocale === 'fr' 
              ? 'Suivez les ventes, expéditions, remboursements et retours clients.' 
              : 'Track sales, shipments, refunds and customer returns.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded-xl border border-admin-border bg-white text-xs font-semibold hover:bg-neutral-50 flex items-center gap-1.5 transition cursor-pointer">
            <Upload className="size-3.5 rotate-180" />
            <span>{systemLocale === 'fr' ? 'Exporter' : 'Export'}</span>
          </button>
          <button className="h-10 px-4 bg-black text-white hover:bg-neutral-800 transition font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
            <Plus className="size-4" />
            <span>{systemLocale === 'fr' ? 'Créer une commande' : 'Create order'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Horizontal Small Cards) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'todo' as const, count: 12, label: systemLocale === 'fr' ? 'À traiter' : 'To process', icon: FileText },
          { id: 'preparing' as const, count: 8, label: systemLocale === 'fr' ? 'En préparation' : 'Preparing', icon: Package },
          { id: 'shipping' as const, count: 47, label: systemLocale === 'fr' ? 'Expédiées' : 'Shipped', icon: Truck },
          { id: 'returns' as const, count: 3, label: systemLocale === 'fr' ? 'Retours ouverts' : 'Open returns', icon: RotateCcw }
        ].map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setStatusTab(c.id)}
              className={`p-4 bg-white border border-admin-border rounded-2xl text-left shadow-2xs hover:border-black transition flex items-center justify-between cursor-pointer ${
                statusTab === c.id ? 'ring-1 ring-black border-black' : ''
              }`}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">{c.label}</p>
                <h4 className="text-2xl font-bold text-black mt-1">{c.count}</h4>
              </div>
              <span className="size-8.5 rounded-xl bg-admin-secondary/40 border border-admin-border/50 flex items-center justify-center text-admin-muted">
                <Icon className="size-4 shrink-0" />
              </span>
            </button>
          );
        })}
      </section>

      {/* 3. Main Split View: Table + Context Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Table Column */}
        <div className="flex-1 w-full space-y-4">
          
          {/* Tab buttons & Filters bar */}
          <div className="bg-white border border-admin-border rounded-2xl shadow-2xs p-4 space-y-4">
            {/* Filter Tabs */}
            <div className="border-b border-admin-border flex gap-6 text-xs font-semibold pb-1 overflow-x-auto">
              {[
                { id: 'all' as const, label: systemLocale === 'fr' ? 'Toutes les commandes' : 'All orders' },
                { id: 'todo' as const, label: systemLocale === 'fr' ? 'À traiter' : 'To process' },
                { id: 'preparing' as const, label: systemLocale === 'fr' ? 'En préparation' : 'In prep' },
                { id: 'shipping' as const, label: systemLocale === 'fr' ? 'Expédiées' : 'Shipped' },
                { id: 'returns' as const, label: systemLocale === 'fr' ? 'Retours' : 'Returns' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusTab(tab.id)}
                  className={`pb-3 transition-colors relative cursor-pointer ${
                    statusTab === tab.id 
                      ? 'text-black font-bold border-b-2 border-black' 
                      : 'text-admin-muted hover:text-black'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Fine filters inputs */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={systemLocale === 'fr' ? 'N° de commande ou client' : 'Order No. or customer'}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-admin-border text-xs outline-none focus:border-black transition"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-admin-muted" />
              </div>

              <select className="h-10 px-3 rounded-xl border border-admin-border bg-white text-xs font-medium outline-none cursor-pointer">
                <option>{systemLocale === 'fr' ? 'Statut' : 'Status'}</option>
              </select>

              <select className="h-10 px-3 rounded-xl border border-admin-border bg-white text-xs font-medium outline-none cursor-pointer">
                <option>{systemLocale === 'fr' ? 'Paiement' : 'Payment'}</option>
              </select>

              <select className="h-10 px-3 rounded-xl border border-admin-border bg-white text-xs font-medium outline-none cursor-pointer">
                <option>{systemLocale === 'fr' ? 'Livraison' : 'Delivery'}</option>
              </select>

              <button className="h-10 px-4 rounded-xl border border-admin-border text-xs font-semibold text-admin-text hover:bg-neutral-50 flex items-center gap-1.5 transition cursor-pointer">
                <SlidersHorizontal className="size-3.5" />
                <span>{systemLocale === 'fr' ? 'Plus de filtres' : 'More filters'}</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-admin-border rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-admin-border bg-admin-ivory/20 text-admin-muted font-semibold">
                    <th className="p-4 w-10">
                      <input type="checkbox" className="rounded border-admin-border" />
                    </th>
                    <th className="p-4">{systemLocale === 'fr' ? 'Commande' : 'Order'}</th>
                    <th className="p-4">{systemLocale === 'fr' ? 'Client' : 'Customer'}</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">{systemLocale === 'fr' ? 'Paiement' : 'Payment'}</th>
                    <th className="p-4">{systemLocale === 'fr' ? 'Livraison' : 'Delivery'}</th>
                    <th className="p-4">{systemLocale === 'fr' ? 'Articles' : 'Items'}</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border/50 font-medium">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const isActive = order.id === selectedOrderId;
                      return (
                        <tr 
                          key={order.id} 
                          onClick={() => setSelectedOrderId(order.id)}
                          className={`hover:bg-neutral-50/50 transition cursor-pointer ${
                            isActive ? 'bg-admin-secondary/40' : ''
                          }`}
                        >
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="rounded border-admin-border" />
                          </td>
                          <td className="p-4 text-black font-semibold">{order.id}</td>
                          <td className="p-4">
                            <div>
                              <p className="font-semibold text-black">{order.customer}</p>
                              <p className="text-[10px] text-admin-muted mt-0.5">{order.email}</p>
                            </div>
                          </td>
                          <td className="p-4 text-admin-muted">{order.date}</td>
                          <td className="p-4">{getPaymentBadge(order.paymentStatus)}</td>
                          <td className="p-4">{getDeliveryBadge(order.deliveryStatus)}</td>
                          <td className="p-4 text-admin-muted">
                            {order.itemsCount} {order.itemsCount > 1 ? (systemLocale === 'fr' ? 'articles' : 'items') : (systemLocale === 'fr' ? 'article' : 'item')}
                          </td>
                          <td className="p-4 text-right text-black font-semibold">{order.total.toFixed(2)} €</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-admin-muted">
                        {systemLocale === 'fr' ? 'Aucune commande trouvée' : 'No orders found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Detail Panel (Alice Martin details context) */}
        <aside className="w-full lg:w-90 bg-white border border-admin-border rounded-2xl shadow-xs p-5 space-y-6 shrink-0 relative animate-fade-in">
          <div className="flex items-center justify-between border-b border-admin-border pb-3.5">
            <div>
              <h3 className="font-bold text-xs text-black">
                {systemLocale === 'fr' ? 'Commande' : 'Order'} {activeOrder.id}
              </h3>
              <div className="mt-1">
                {getPaymentBadge(activeOrder.paymentStatus)}
              </div>
            </div>
          </div>

          {/* Profile block */}
          <div className="flex items-center justify-between p-3.5 bg-admin-ivory/30 border border-admin-border/60 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-admin-secondary text-black font-bold text-xs flex items-center justify-center border border-admin-border">
                {activeOrder.customer.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-black truncate">{activeOrder.customer}</p>
                <p className="text-[10px] text-admin-muted truncate mt-0.5">{activeOrder.email}</p>
                <p className="text-[10px] text-admin-muted truncate">{activeOrder.phone}</p>
              </div>
            </div>
            <button className="h-7 px-2.5 rounded-lg border border-admin-border bg-white text-[10px] font-bold text-admin-text hover:border-black flex items-center gap-1 transition cursor-pointer">
              <Mail className="size-3" />
              <span>{systemLocale === 'fr' ? 'Contacter' : 'Message'}</span>
            </button>
          </div>

          {/* Shipping status Timeline */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Suivi de commande</h4>
            
            <div className="space-y-4 relative pl-5 text-xs font-semibold before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-admin-border">
              <div className="relative">
                <span className="absolute -left-5 top-0.5 size-3 bg-[#247A52] rounded-full border-2 border-white" />
                <p className="text-black">{systemLocale === 'fr' ? 'Commande reçue' : 'Order received'}</p>
                <p className="text-[10px] text-admin-muted font-normal mt-0.5">{activeOrder.date}</p>
              </div>
              <div className="relative">
                <span className={`absolute -left-5 top-0.5 size-3 rounded-full border-2 border-white ${
                  activeOrder.paymentStatus === 'paid' ? 'bg-[#247A52]' : 'bg-neutral-300'
                }`} />
                <p className="text-black">{systemLocale === 'fr' ? 'Paiement confirmé' : 'Payment confirmed'}</p>
                {activeOrder.paymentStatus === 'paid' && <p className="text-[10px] text-admin-muted font-normal mt-0.5">{activeOrder.date}</p>}
              </div>
              <div className="relative">
                <span className={`absolute -left-5 top-0.5 size-3 rounded-full border-2 border-white ${
                  activeOrder.deliveryStatus === 'shipping' || activeOrder.deliveryStatus === 'delivered' ? 'bg-[#247A52]' : 'bg-neutral-300'
                }`} />
                <p className="text-black">{systemLocale === 'fr' ? 'À préparer' : 'To prepare'}</p>
                <p className="text-[10px] text-admin-muted font-normal mt-0.5">En attente d'expédition</p>
              </div>
            </div>
          </div>

          {/* Product Items Details */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Articles</h4>
            <div className="flex items-start justify-between gap-3 p-3 border border-admin-border rounded-xl">
              <div className="flex gap-3 min-w-0">
                <div className="relative size-11 rounded-lg overflow-hidden border border-admin-border bg-neutral-100 shrink-0">
                  <Image
                    src={activeOrder.productImage}
                    alt={activeOrder.productName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-black truncate">{activeOrder.productName}</p>
                  <p className="text-[10px] text-admin-muted mt-0.5">{activeOrder.productVariant}</p>
                  <p className="text-[9px] font-mono text-admin-muted mt-0.5">{activeOrder.productSku}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-admin-muted font-semibold">Qté {activeOrder.productQty}</p>
                <p className="font-bold text-xs text-black mt-1">{activeOrder.total.toFixed(2)} €</p>
              </div>
            </div>
          </div>

          {/* Delivery & Shipping address Info */}
          <div className="space-y-4 pt-4 border-t border-admin-border/60 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-bold text-[10px] uppercase text-admin-muted tracking-wider">Adresse de livraison</h5>
                <p className="font-semibold text-black mt-2 leading-relaxed">{activeOrder.customer}</p>
                <p className="text-admin-muted mt-1 leading-relaxed">{activeOrder.address}</p>
              </div>
              <div>
                <h5 className="font-bold text-[10px] uppercase text-admin-muted tracking-wider">Méthode de livraison</h5>
                <p className="font-semibold text-black mt-2 leading-relaxed">{activeOrder.shippingMethod}</p>
                <p className="text-admin-muted mt-1 font-mono">Suivi: {activeOrder.trackingNumber}</p>
              </div>
            </div>
          </div>

          {/* Delivery Process Actions */}
          <div className="pt-4 border-t border-admin-border/60 flex items-center gap-3">
            {activeOrder.deliveryStatus === 'preparing' && (
              <button
                onClick={() => handleCreateShipment(activeOrder.id)}
                className="flex-1 h-10 bg-black text-white hover:bg-neutral-800 transition font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Truck className="size-4" />
                <span>Créer l'expédition</span>
              </button>
            )}
            {activeOrder.paymentStatus === 'paid' && (
              <button
                onClick={() => handleRefund(activeOrder.id)}
                className="flex-1 h-10 border border-admin-border bg-white text-admin-text hover:bg-neutral-50 transition font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="size-4 text-admin-muted" />
                <span>Rembourser</span>
              </button>
            )}
          </div>

          {/* Return Management Area (RET-001 mockup) */}
          {activeOrder.returnReason && (
            <div className="p-4 bg-admin-secondary/20 border border-admin-border rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-black">Retour client</span>
                <span className="text-[9px] font-bold text-[#247A52] bg-green-50 px-2 py-0.5 rounded-full border border-green-150">
                  Retour reçu
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-admin-muted tracking-wider">Raison du retour</p>
                  <select className="w-full h-8 mt-1.5 px-2 rounded-lg border border-admin-border bg-white text-[11px] font-semibold outline-none cursor-pointer">
                    <option>{activeOrder.returnReason}</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-admin-muted tracking-wider">État de l'article</p>
                  <select className="w-full h-8 mt-1.5 px-2 rounded-lg border border-admin-border bg-white text-[11px] font-semibold outline-none cursor-pointer">
                    <option>Comme neuf</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-black font-semibold cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="size-4 rounded border-admin-border accent-black" />
                <span>Remettre en stock</span>
              </label>

              <div>
                <p className="text-[10px] font-bold uppercase text-admin-muted tracking-wider">Montant du remboursement</p>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    defaultValue={activeOrder.total.toFixed(2)}
                    className="w-full h-8 px-2 pr-6 rounded-lg border border-admin-border bg-white text-[11px] font-bold outline-none text-right"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-admin-muted">€</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleRefund(activeOrder.id)}
                  className="flex-1 h-9 bg-black text-white hover:bg-neutral-800 transition font-semibold rounded-lg text-[10px] flex items-center justify-center cursor-pointer"
                >
                  Approuver le retour
                </button>
                <button
                  className="h-9 px-3 border border-admin-border bg-white text-admin-muted hover:text-black hover:bg-neutral-50 transition font-semibold rounded-lg text-[10px] cursor-pointer"
                >
                  Refuser
                </button>
              </div>
            </div>
          )}

        </aside>

      </div>

    </div>
  );
}
