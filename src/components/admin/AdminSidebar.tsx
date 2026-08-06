'use client';

import React, { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  RotateCcw, 
  MessageSquare, 
  Users,
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  ChevronDown
} from 'lucide-react';

type SidebarLink = {
  name: string;
  nameEn: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'orders' | 'returns' | 'messages';
};

const SIDEBAR_LINKS: SidebarLink[] = [
  { name: 'Vue d\'ensemble', nameEn: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Produits', nameEn: 'Products', href: '/produits', icon: ShoppingBag },
  { name: 'Commandes', nameEn: 'Orders', href: '/commandes', icon: Receipt, badgeKey: 'orders' },
  { name: 'Retours', nameEn: 'Returns', href: '/retours', icon: RotateCcw, badgeKey: 'returns' },
  { name: 'Messages', nameEn: 'Messages', href: '/messages', icon: MessageSquare, badgeKey: 'messages' },
  { name: 'Clients', nameEn: 'Customers', href: '/clients', icon: Users },
  { name: 'Paramètres', nameEn: 'Settings', href: '/parametres', icon: Settings },
];

type AdminSidebarProps = {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function AdminSidebar({ isCollapsed: controlledCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const systemLocale = useLocale() as 'fr' | 'en';
  const pathname = usePathname();
  
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const isSidebarCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;
  
  const toggleCollapse = onToggleCollapse || (() => setLocalCollapsed(!localCollapsed));

  const badges = {
    orders: 12,
    returns: 3,
    messages: 8
  };

  return (
    <aside 
      className={`hidden lg:flex flex-col justify-between border-r border-admin-border bg-white text-admin-text transition-[width] duration-300 relative z-30 shrink-0 ${
        isSidebarCollapsed ? 'w-20' : 'w-[260px]'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute top-7 -right-3.5 grid size-7 place-items-center rounded-full border border-admin-border bg-white text-admin-muted hover:text-black hover:shadow-xs transition z-50 cursor-pointer"
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isSidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      <div>
        {/* Brand Header */}
        <div className="h-20 border-b border-admin-border flex items-center px-6 gap-3">
          {isSidebarCollapsed ? (
            <div className="font-serif text-xl font-bold tracking-tight text-black">R.</div>
          ) : (
            <div className="animate-fade-in">
              <span className="font-serif text-2xl font-bold tracking-widest text-black block leading-none">REIGN</span>
              <span className="text-[9px] font-bold tracking-[0.2em] text-admin-muted uppercase block mt-1.5 leading-none">
                ADMIN
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {SIDEBAR_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href) || (link.href === '/dashboard' && pathname === '/dashboard');
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-semibold transition group relative ${
                  isActive 
                    ? 'bg-admin-secondary text-black' 
                    : 'text-admin-muted hover:text-black hover:bg-neutral-50/70'
                }`}
              >
                <Icon className={`size-4.5 shrink-0 transition-colors ${
                  isActive ? 'text-black' : 'text-admin-muted group-hover:text-black'
                }`} />
                
                {!isSidebarCollapsed && (
                  <span className="animate-fade-in">
                    {systemLocale === 'fr' ? link.name : link.nameEn}
                  </span>
                )}

                {/* Badge notifications count */}
                {!isSidebarCollapsed && link.badgeKey && (
                  <span className={`ml-auto size-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                    link.badgeKey === 'messages' 
                      ? 'bg-[#247A52] text-white' 
                      : 'bg-black text-white'
                  }`}>
                    {badges[link.badgeKey]}
                  </span>
                )}

                {/* Collapsed Tooltip or collapsed badge count */}
                {isSidebarCollapsed && (
                  <div className="absolute left-20 ml-2 scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition duration-150 origin-left z-55 px-3 py-1.5 rounded-md bg-black text-white text-xs font-semibold whitespace-nowrap shadow-md">
                    {systemLocale === 'fr' ? link.name : link.nameEn}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout / User Info Footer */}
      <div className="p-4 border-t border-admin-border space-y-2">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="size-8.5 rounded-full bg-admin-secondary text-black font-semibold text-xs flex items-center justify-center border border-admin-border shrink-0">
                JA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-black truncate leading-none">Jean Admin</p>
                <p className="text-[10px] text-admin-muted mt-1 leading-none">Administrateur</p>
              </div>
            </div>
            <ChevronDown className="size-3.5 text-admin-muted" />
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <div className="size-8.5 rounded-full bg-admin-secondary text-black font-semibold text-xs flex items-center justify-center border border-admin-border">
              JA
            </div>
          </div>
        )}
        
        <Link
          href="/connexion"
          className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold text-admin-muted hover:text-admin-error hover:bg-red-50/30 transition group relative ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="size-4 shrink-0" />
          {!isSidebarCollapsed && (
            <span className="animate-fade-in">
              {systemLocale === 'fr' ? 'Se déconnecter' : 'Logout'}
            </span>
          )}
          
          {isSidebarCollapsed && (
            <div className="absolute left-20 ml-2 scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition duration-150 origin-left z-55 px-3 py-1.5 rounded-md bg-admin-error text-white text-xs font-semibold whitespace-nowrap shadow-md">
              {systemLocale === 'fr' ? 'Se déconnecter' : 'Logout'}
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
