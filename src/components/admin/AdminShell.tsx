'use client';

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState, type ReactNode } from 'react';
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, MessageSquare, Package, RotateCcw, Search, Settings, ShoppingBag, Users, X } from 'lucide-react';
import { useAdminDemo } from '@/context/AdminDemoContext';

const navigation = [
  { label: "Vue d'ensemble", href: '/fr/dashboard', icon: LayoutDashboard },
  { label: 'Produits', href: '/fr/produits', icon: Package },
  { label: 'Commandes', href: '/fr/commandes', icon: ShoppingBag, badge: '12' },
  { label: 'Retours', href: '/fr/retours', icon: RotateCcw, badge: '3' },
  { label: 'Messages', href: '/fr/messages', icon: MessageSquare, badge: '8' },
  { label: 'Clients', href: '/fr/clients', icon: Users },
  { label: 'Paramètres', href: '/fr/parametres', icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return <div className="flex h-full flex-col bg-[#fbfaf7]">
    <div className="flex h-[88px] items-center border-b border-admin-border px-7"><div><p className="font-serif text-[28px] tracking-[.14em]">REIGN</p><p className="mt-0.5 text-[9px] font-bold tracking-[.32em]">ADMIN</p></div></div>
    <nav aria-label="Navigation principale" className="flex-1 space-y-1 px-3 py-6">
      {navigation.map(({ label, href, icon: Icon, badge }) => <a key={label} href={href} onClick={onNavigate} className={`flex min-h-12 items-center gap-3 rounded-lg px-4 text-sm transition hover:bg-white ${label === "Vue d'ensemble" ? 'border border-admin-border bg-white font-semibold shadow-sm' : 'text-neutral-700'}`}><Icon aria-hidden className="size-5 stroke-[1.6]" /><span className="flex-1">{label}</span>{badge && <span className={`rounded-full px-2 py-0.5 text-xs ${label === 'Messages' ? 'bg-admin-success text-white' : 'bg-black text-white'}`}>{badge}</span>}</a>)}
    </nav>
    <div className="border-t border-admin-border p-4"><button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-white"><span className="grid size-9 place-items-center rounded-full bg-[#ece8dc] font-semibold">JA</span><span className="flex-1 text-left"><b className="block">Jean Admin</b><span className="text-xs text-admin-muted">Administrateur</span></span><ChevronDown className="size-4" /></button><a href="/fr/connexion" className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-white"><LogOut className="size-5" />Se déconnecter</a></div>
  </div>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { state, setSidebarCollapsed } = useAdminDemo();
  const [open, setOpen] = useState(false);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  return <div className="min-h-screen bg-admin-ivory text-admin-text">
    <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-admin-border lg:block ${state.preferences.sidebarCollapsed ? 'w-20 overflow-hidden' : 'w-56 xl:w-60'}`}><SidebarContent /></aside>
    {open && <div role="dialog" aria-label="Navigation" aria-modal="true" className="fixed inset-0 z-50 lg:hidden"><button aria-label="Fermer la navigation" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><aside className="relative h-full w-[286px] border-r border-admin-border"><SidebarContent onNavigate={() => setOpen(false)} /><button aria-label="Fermer la navigation" onClick={() => setOpen(false)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white"><X className="size-5" /></button></aside></div>}
    <div className={`transition-[padding] ${state.preferences.sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-56 xl:pl-60'}`}>
      <header className="sticky top-0 z-20 flex h-[70px] items-center gap-4 border-b border-admin-border bg-white/95 px-4 backdrop-blur sm:px-7">
        <button aria-label="Ouvrir la navigation" className="grid size-10 place-items-center lg:hidden" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
        <button aria-label="Réduire la navigation" className="hidden text-xs text-admin-muted lg:block" onClick={() => setSidebarCollapsed(!state.preferences.sidebarCollapsed)}>{state.preferences.sidebarCollapsed ? 'Agrandir' : 'Réduire'}</button>
        <label className="mx-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-lg border border-admin-border bg-white px-3 md:flex"><Search className="size-4 text-admin-muted" /><span className="sr-only">Rechercher</span><input className="w-full border-0 bg-transparent text-sm outline-none" placeholder="Rechercher une commande, un produit..." /></label>
        <button aria-label="Notifications" className="relative grid size-10 place-items-center"><Bell className="size-5" /><span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-black text-[9px] text-white">6</span></button>
        <button className="hidden items-center gap-2 sm:flex"><span className="grid size-9 place-items-center rounded-full bg-neutral-200 text-xs">JA</span><ChevronDown className="size-4" /></button>
      </header>
      <main className="p-4 sm:p-7 lg:p-8">{children}</main>
    </div>
  </div>;
}
