'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { 
  Store, 
  CreditCard, 
  Truck, 
  MessageSquare,
  Users,
  Check,
  Bell,
  Trash2,
  Lock,
  RotateCcw,
  FileText
} from 'lucide-react';

type Tab = 'general' | 'paiements' | 'livraison' | 'retours' | 'notifications' | 'whatsapp' | 'equipe' | 'securite' | 'facturation';

interface StoreSettings {
  shop_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  accent_color?: string;
  min_shipping_free?: string;
  return_period?: string;
  whatsapp_sync?: boolean;
  whatsapp_assignee?: string;
  whatsapp_number?: string;
}

export default function ParametresPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    shop_name: 'DivinExpress',
    email: 'contact@divinexpress.fr',
    phone: '+33 6 12 34 56 78',
    address: '12 Rue de la Paix, 75002 Paris',
    country: 'France',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    accent_color: '#0B0B0B',
    min_shipping_free: '150,00',
    return_period: '14 jours',
    whatsapp_sync: true,
    whatsapp_assignee: 'Service client',
  });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setSettings(data as StoreSettings);
        setHasChanges(false);
      })
      .catch(() => undefined);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setIsSaved(true);
        setHasChanges(false);
        setTimeout(() => {
          setIsSaved(false);
        }, 4000);
      }
    } catch {
      alert('Error saving settings');
    }
  };

  const updateSetting = (key: keyof StoreSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-admin-text font-sans">
      
      {/* 1. Header with Save Status Indicators & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-admin-border pb-5">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            {systemLocale === 'fr' ? 'Paramètres' : 'Settings'}
          </h1>
          <p className="text-xs text-admin-muted mt-1.5 font-medium">
            {systemLocale === 'fr' 
              ? 'Configurez votre boutique, vos paiements et vos intégrations.' 
              : 'Configure your boutique, payments and integrations.'}
          </p>
        </div>

        {/* Change status & Actions buttons */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {hasChanges ? (
            <span className="text-[11px] font-semibold text-admin-alert flex items-center gap-1.5">
              <span className="size-2 bg-admin-alert rounded-full" />
              {systemLocale === 'fr' ? 'Modifications non enregistrées' : 'Unsaved changes'}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#247A52] flex items-center gap-1.5">
              <Check className="size-3.5 text-[#247A52]" />
              {systemLocale === 'fr' ? 'Modifications enregistrées' : 'Changes saved'}
            </span>
          )}

          <div className="flex items-center gap-2.5">
            <button 
              type="button" 
              onClick={() => setHasChanges(false)}
              className="h-10 px-4 rounded-xl border border-admin-border bg-white text-xs font-semibold text-admin-text hover:bg-neutral-50 transition cursor-pointer"
            >
              {systemLocale === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button 
              type="button"
              onClick={handleSave}
              className="h-10 px-5 bg-black text-white hover:bg-neutral-800 transition font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {systemLocale === 'fr' ? 'Enregistrer les modifications' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Layout Side Navigation + Grid Content */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Tabs Nav */}
        <nav className="w-full lg:w-60 bg-white border border-admin-border rounded-2xl p-3.5 space-y-1.5 shrink-0 shadow-2xs">
          {[
            { id: 'general' as const, label: systemLocale === 'fr' ? 'Général' : 'General', icon: Store },
            { id: 'paiements' as const, label: systemLocale === 'fr' ? 'Paiements' : 'Payments', icon: CreditCard },
            { id: 'livraison' as const, label: systemLocale === 'fr' ? 'Livraison' : 'Shipping', icon: Truck },
            { id: 'retours' as const, label: systemLocale === 'fr' ? 'Retours et remboursements' : 'Returns & Refunds', icon: RotateCcw },
            { id: 'notifications' as const, label: systemLocale === 'fr' ? 'Notifications' : 'Notifications', icon: Bell },
            { id: 'whatsapp' as const, label: systemLocale === 'fr' ? 'WhatsApp' : 'WhatsApp Business', icon: MessageSquare },
            { id: 'equipe' as const, label: systemLocale === 'fr' ? 'Équipe et permissions' : 'Team & Permissions', icon: Users },
            { id: 'securite' as const, label: systemLocale === 'fr' ? 'Sécurité' : 'Security', icon: Lock },
            { id: 'facturation' as const, label: systemLocale === 'fr' ? 'Facturation' : 'Billing', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-left border ${
                  isActive 
                    ? 'bg-indigo-50/70 border-indigo-100/50 text-indigo-600 shadow-xs' 
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Content Area */}
        <div className="flex-1 w-full space-y-6">

          {isSaved && (
            <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-150 text-[#247A52] rounded-xl text-xs font-semibold animate-fade-in shadow-2xs">
              <Check className="size-4 shrink-0" />
              <span>{systemLocale === 'fr' ? 'Enregistré automatiquement il y a quelques secondes' : 'Saved automatically a few seconds ago'}</span>
            </div>
          )}

          {/* TAB: General (Match exactly screenshots) */}
          {activeTab === 'general' && (
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Card 1: Shop details */}
              <div className="bg-white border border-admin-border rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-sm font-bold border-b border-admin-border pb-3 mb-2">
                  {systemLocale === 'fr' ? 'Informations de la boutique' : 'Boutique details'}
                </h3>
                
                <div className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Nom de la boutique</label>
                    <input 
                      type="text" 
                      value={settings.shop_name || ''} 
                      onChange={(e) => updateSetting('shop_name', e.target.value)}
                      className="w-full h-11 px-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-black shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Email</label>
                    <input 
                      type="email" 
                      value={settings.email || ''} 
                      onChange={(e) => updateSetting('email', e.target.value)}
                      className="w-full h-11 px-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-black shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Téléphone</label>
                    <input 
                      type="text" 
                      value={settings.phone || ''} 
                      onChange={(e) => updateSetting('phone', e.target.value)}
                      className="w-full h-11 px-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-black shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Adresse</label>
                    <input 
                      type="text" 
                      value={settings.address || ''} 
                      onChange={(e) => updateSetting('address', e.target.value)}
                      className="w-full h-11 px-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-black shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Pays</label>
                      <select 
                        value={settings.country || 'France'}
                        onChange={(e) => updateSetting('country', e.target.value)}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 cursor-pointer shadow-2xs"
                      >
                        <option>France</option>
                        <option>Belgique</option>
                        <option>Canada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Devise</label>
                      <select 
                        value={settings.currency || 'EUR'}
                        onChange={(e) => updateSetting('currency', e.target.value)}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 cursor-pointer shadow-2xs"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Fuseau horaire</label>
                      <select 
                        value={settings.timezone || 'Europe/Paris'}
                        onChange={(e) => updateSetting('timezone', e.target.value)}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 cursor-pointer shadow-2xs"
                      >
                        <option>Europe/Paris</option>
                        <option>America/New_York</option>
                        <option>Europe/London</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Visual Identity */}
              <div className="bg-white border border-admin-border rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-sm font-bold border-b border-admin-border pb-3 mb-2">
                  {systemLocale === 'fr' ? 'Identité visuelle' : 'Visual identity'}
                </h3>
                
                <div className="space-y-4 text-xs font-semibold">
                  {/* Logo upload widget */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Logo de la boutique</label>
                    <div className="p-4 border border-admin-border rounded-xl flex items-center justify-between">
                      <span className="font-serif text-xl font-bold tracking-widest text-black">{settings.shop_name || 'DivinExpress'}</span>
                      <div className="flex gap-2">
                        <button type="button" className="h-8 px-3 rounded-lg border border-admin-border hover:border-black text-[10px] font-bold text-admin-text transition cursor-pointer bg-white">
                          Changer le logo
                        </button>
                        <button type="button" className="size-8 rounded-lg border border-admin-border hover:border-admin-error text-admin-muted hover:text-admin-error flex items-center justify-center transition cursor-pointer bg-white">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Favicon widget */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Favicon</label>
                    <div className="p-4 border border-admin-border rounded-xl flex items-center justify-between">
                      <div className="size-9 rounded bg-black text-white font-serif font-bold text-lg flex items-center justify-center">
                        {(settings.shop_name || 'R').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="h-8 px-3 rounded-lg border border-admin-border hover:border-black text-[10px] font-bold text-admin-text transition cursor-pointer bg-white">
                          Changer
                        </button>
                        <button type="button" className="size-8 rounded-lg border border-admin-border hover:border-admin-error text-admin-muted hover:text-admin-error flex items-center justify-center transition cursor-pointer bg-white">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Accent Color picker input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Couleur principale</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 size-4.5 rounded-full bg-black border border-slate-200" />
                      <input 
                        type="text" 
                        value={settings.accent_color || '#0B0B0B'} 
                        onChange={(e) => updateSetting('accent_color', e.target.value)}
                        className="w-full h-11 pl-11 pr-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-black shadow-2xs"
                      />
                    </div>
                    <p className="text-[10px] text-admin-muted mt-2">Couleur utilisée pour les boutons et éléments clés.</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Payments providers status check */}
              <div className="bg-white border border-admin-border rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-sm font-bold border-b border-admin-border pb-3 mb-2">
                  {systemLocale === 'fr' ? 'Paiements' : 'Payments'}
                </h3>
                
                <div className="space-y-3.5 text-xs font-semibold">
                  {[
                    { name: 'Stripe', status: 'config', label: systemLocale === 'fr' ? 'À connecter' : 'Not connected', btn: systemLocale === 'fr' ? 'Bientôt disponible' : 'Coming soon' },
                    { name: 'PayPal', status: 'config', label: systemLocale === 'fr' ? 'À connecter' : 'Not connected', btn: systemLocale === 'fr' ? 'Bientôt disponible' : 'Coming soon' },
                    { name: 'GeniusPay', status: 'config', label: systemLocale === 'fr' ? 'À connecter' : 'Not connected', btn: systemLocale === 'fr' ? 'Bientôt disponible' : 'Coming soon' }
                  ].map((p) => (
                    <div key={p.name} className="p-4 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs text-black">{p.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          p.status === 'connected' 
                            ? 'bg-green-50 text-[#247A52] border-green-150' 
                            : 'bg-amber-50 text-[#B76A16] border-amber-150'
                        }`}>
                          {p.label}
                        </span>
                      </div>
                      <button type="button" disabled className="h-8 px-3 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 bg-slate-50 cursor-not-allowed">
                        {p.btn}
                      </button>
                    </div>
                  ))}
                  <p className="text-[10px] text-admin-muted">Les clients seront redirigés vers la page sécurisée du prestataire.</p>
                </div>
              </div>

              {/* Card 4: Shipping details */}
              <div className="bg-white border border-admin-border rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-sm font-bold border-b border-admin-border pb-3 mb-2">
                  {systemLocale === 'fr' ? 'Livraison et retours' : 'Shipping & Returns'}
                </h3>
                
                <div className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Montant minimum pour la livraison gratuite</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={settings.min_shipping_free || '150,00'} 
                        onChange={(e) => updateSetting('min_shipping_free', e.target.value)}
                        className="w-full h-11 px-4 pr-8 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-black font-bold text-right shadow-2xs"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Délai de retour</label>
                    <select 
                      value={settings.return_period || '14 jours'}
                      onChange={(e) => updateSetting('return_period', e.target.value)}
                      className="w-full h-11 px-3 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 cursor-pointer shadow-2xs"
                    >
                      <option>14 jours</option>
                      <option>30 jours</option>
                      <option>60 jours</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3 text-xs text-black font-semibold cursor-pointer select-none pt-2">
                    <input type="checkbox" defaultChecked className="size-4.5 rounded border-slate-300 accent-indigo-600 focus:ring-indigo-500/20" />
                    <span>Remettre automatiquement en stock après approbation</span>
                  </label>
                </div>
              </div>

              {/* Card 5: WhatsApp Business integration status */}
              <div className="bg-white border border-admin-border rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-sm font-bold border-b border-admin-border pb-3 mb-2">
                  {systemLocale === 'fr' ? 'WhatsApp Business' : 'WhatsApp Business'}
                </h3>
                
                <div className="space-y-4 text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-black">{systemLocale === 'fr' ? 'Numéro préparé' : 'Configured number'}</p>
                      <p className="text-[10px] text-admin-muted mt-1">{settings.whatsapp_number || '—'}</p>
                    </div>
                    <button type="button" disabled className="h-8 px-3 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 bg-slate-50 cursor-not-allowed">
                      {systemLocale === 'fr' ? 'Clés requises' : 'Credentials required'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase text-admin-muted tracking-wider">Compte Business</p>
                      <p className="font-bold text-black mt-1.5">—</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-admin-muted tracking-wider">Statut du webhook</p>
                      <p className="font-bold text-amber-700 flex items-center gap-1.5 mt-1.5">
                        <span className="size-1.5 bg-amber-500 rounded-full" />
                        {systemLocale === 'fr' ? 'Non connecté' : 'Not connected'}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 text-xs text-black font-semibold cursor-pointer select-none border-t border-slate-150 pt-4">
                    <input 
                      type="checkbox" 
                      checked={settings.whatsapp_sync ?? true} 
                      onChange={(e) => updateSetting('whatsapp_sync', e.target.checked)}
                      className="size-4.5 rounded border-slate-300 accent-indigo-600 focus:ring-indigo-500/20" 
                    />
                    <span>Synchroniser les nouveaux messages</span>
                  </label>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-admin-muted mb-2">Assignation par défaut</label>
                    <select 
                      value={settings.whatsapp_assignee || 'Service client'} 
                      onChange={(e) => updateSetting('whatsapp_assignee', e.target.value)}
                      className="w-full h-11 px-3 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 cursor-pointer shadow-2xs"
                    >
                      <option>Service client</option>
                      <option>Support Technique</option>
                      <option>Administration</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 6: Email and webhook notifications toggle bascules */}
              <div className="bg-white border border-admin-border rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-sm font-bold border-b border-admin-border pb-3 mb-2">
                  {systemLocale === 'fr' ? 'Notifications' : 'Notifications'}
                </h3>
                
                <div className="space-y-4 text-xs font-semibold">
                  <p className="text-[10px] text-admin-muted">Choisissez les notifications par email que vous souhaitez recevoir.</p>
                  
                  {[
                    { label: 'Nouvelle commande', desc: 'Recevoir un email à chaque nouvelle commande.' },
                    { label: 'Retour demandé', desc: 'Être notifié lorsqu\'un client demande un retour.' },
                    { label: 'Stock faible', desc: 'Être alerté quand un produit est en stock faible.' },
                    { label: 'Paiement échoué', desc: 'Recevoir un email si un paiement échoue.' }
                  ].map((n) => (
                    <div key={n.label} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-xs text-black">{n.label}</p>
                        <p className="text-[10px] text-admin-muted mt-1 leading-normal">{n.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="size-4.5 rounded border-admin-border accent-black shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 7: Danger zone sensible (Red border) */}
              <div className="bg-white border border-admin-error rounded-2xl p-6 shadow-xs space-y-4 md:col-span-2">
                <h3 className="font-serif text-sm font-bold border-b border-admin-error pb-3 mb-2 text-admin-error">
                  {systemLocale === 'fr' ? 'Zone sensible' : 'Danger zone'}
                </h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold">
                  <div>
                    <p className="text-black font-bold">{systemLocale === 'fr' ? 'Désactiver la boutique' : 'Deactivate store'}</p>
                    <p className="text-admin-muted mt-1">{systemLocale === 'fr' ? 'La désactivation de la boutique la rendra inaccessible à vos clients.' : 'Deactivating the store will make it inaccessible to your customers.'}</p>
                  </div>
                  
                  <button 
                    type="button"
                    className="h-10 px-5 border border-admin-error text-admin-error hover:bg-red-50/50 transition font-semibold rounded-xl text-xs cursor-pointer shrink-0"
                  >
                    {systemLocale === 'fr' ? 'Désactiver la boutique' : 'Deactivate store'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
