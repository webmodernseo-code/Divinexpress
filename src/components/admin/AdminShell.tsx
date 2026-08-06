'use client';

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname() || '';
  const getPathWithoutLocale = (p: string) => p.replace(/^\/(fr|en)/, '') || '/';

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Brand Header with real logo and Admin pill */}
      <div className="flex h-[70px] items-center gap-2 border-b border-admin-border px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/branding/logo-reign.png"
            alt="Reign"
            width={85}
            height={30}
            priority
            className="h-6 w-auto"
          />
          <span className="rounded-md bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-indigo-600 uppercase">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation items styled like modern SaaS (Stripe/Linear) */}
      <nav aria-label="Navigation principale" className="flex-1 space-y-1.5 px-4 py-6">
        {navigation.map(({ label, href, icon: Icon, badge }) => {
          const cleanPath = getPathWithoutLocale(pathname);
          const cleanHref = getPathWithoutLocale(href);
          const isActive = cleanPath === cleanHref || cleanPath.startsWith(cleanHref + '/');
          return (
            <a
              key={label}
              href={href}
              onClick={onNavigate}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon aria-hidden className={`size-4.5 stroke-[1.8] ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    label === 'Messages' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  {badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Profile Footer with custom styling */}
      <div className="border-t border-admin-border p-4 space-y-2">
        <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left text-xs hover:bg-slate-50 transition-all duration-200">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-sm shadow-sm shadow-indigo-500/10">
            JA
          </span>
          <span className="flex-1 min-w-0">
            <b className="block truncate text-slate-800 text-[13px]">Jean Admin</b>
            <span className="block text-[11px] text-slate-500 truncate">Administrateur</span>
          </span>
          <ChevronDown className="size-3.5 text-slate-400" />
        </button>
        <a
          href="/fr/connexion"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-200"
        >
          <LogOut className="size-4 text-rose-500" />
          Se déconnecter
        </a>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { state, setSidebarCollapsed } = useAdminDemo();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <div className="min-h-screen bg-admin-ivory text-admin-text">
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-admin-border bg-white lg:block transition-all duration-300 ${
          state.preferences.sidebarCollapsed ? 'w-20 overflow-hidden' : 'w-56 xl:w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {open && (
        <div role="dialog" aria-label="Navigation" aria-modal="true" className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fermer la navigation"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[286px] border-r border-admin-border bg-white animate-slide-in-right">
            <SidebarContent onNavigate={() => setOpen(false)} />
            <button
              aria-label="Fermer la navigation"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all duration-200"
            >
              <X className="size-4" />
            </button>
          </aside>
        </div>
      )}

      {/* Content wrapper */}
      <div
        className={`transition-[padding] duration-300 ${
          state.preferences.sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-56 xl:pl-60'
        }`}
      >
        {/* Modern SaaS Header */}
        <header className="sticky top-0 z-20 flex h-[70px] items-center gap-4 border-b border-admin-border bg-white/80 px-4 backdrop-blur-md sm:px-7">
          <button
            aria-label="Ouvrir la navigation"
            className="grid size-10 place-items-center rounded-xl hover:bg-slate-100 text-slate-500 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <button
            aria-label="Réduire la navigation"
            className="hidden text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 lg:block transition-colors"
            onClick={() => setSidebarCollapsed(!state.preferences.sidebarCollapsed)}
          >
            {state.preferences.sidebarCollapsed ? 'Agrandir' : 'Réduire'}
          </button>

          {/* Styled search input */}
          <label className="mx-auto hidden h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100/50 transition-all duration-200 px-3 md:flex">
            <Search className="size-4 text-slate-400" />
            <span className="sr-only">Rechercher</span>
            <input
              className="w-full border-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
              placeholder="Rechercher une commande, un produit..."
            />
          </label>

          {/* Notifications Button */}
          <button
            aria-label="Notifications"
            className="relative grid size-10 place-items-center rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all duration-200"
          >
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-indigo-600 text-[9px] font-extrabold text-white">
              6
            </span>
          </button>

          {/* Topbar User profile dropdown */}
          <button className="hidden items-center gap-2 sm:flex hover:bg-slate-50 p-1.5 rounded-xl transition-all duration-200">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
              JA
            </span>
            <ChevronDown className="size-3.5 text-slate-500" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-7 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
