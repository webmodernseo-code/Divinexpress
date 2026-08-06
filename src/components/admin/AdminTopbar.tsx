'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { 
  Search, 
  Bell, 
  Menu, 
  Plus,
  Package,
  MessageSquare
} from 'lucide-react';

type AdminTopbarProps = {
  onOpenMobileNav: () => void;
  title?: string;
};

export function AdminTopbar({ onOpenMobileNav, title }: AdminTopbarProps) {
  const router = useRouter();
  const systemLocale = useLocale() as 'fr' | 'en';
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-20 border-b border-admin-border bg-white text-admin-text px-4 sm:px-6 lg:px-8 flex items-center justify-between relative z-20 shrink-0">
      
      {/* Left Area: Mobile Menu + Breadcrumb path */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg border border-admin-border text-admin-muted hover:text-black hover:bg-neutral-50 transition cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
          <span className="text-admin-muted">Administration</span>
          <span className="text-admin-border font-normal">/</span>
          <span className="text-black font-bold">{title}</span>
        </div>
      </div>

      {/* Center Area: Fine Search Bar with Keyboard shortcut */}
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={systemLocale === 'fr' ? 'Rechercher une commande, un produit...' : 'Search order, product...'}
            className="w-full h-11 pl-10 pr-12 rounded-xl border border-admin-border bg-admin-ivory/30 text-xs outline-none focus:border-black focus:bg-white transition"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-admin-muted" />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-admin-border bg-white text-[9px] text-admin-muted font-bold font-mono shadow-2xs">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative size-11 rounded-xl border border-admin-border flex items-center justify-center hover:bg-neutral-50 transition text-admin-muted hover:text-black cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="size-4.5" />
            <span className="absolute top-1.5 right-1.5 size-4 bg-admin-error text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
              6
            </span>
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="absolute right-0 mt-2 w-85 bg-white border border-admin-border rounded-2xl shadow-lg p-4 z-40 animate-fade-in text-xs">
                <div className="flex items-center justify-between border-b border-admin-border pb-2.5 mb-2.5">
                  <h4 className="font-serif font-bold text-sm">Notifications</h4>
                  <span className="text-[10px] text-admin-muted font-medium bg-admin-secondary px-2 py-0.5 rounded-full">
                    6 {systemLocale === 'fr' ? 'nouvelles' : 'new'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="p-2 rounded-lg hover:bg-neutral-50 transition cursor-pointer flex gap-2.5 items-start">
                    <Package className="size-4 text-admin-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-black">{systemLocale === 'fr' ? 'Stock faible' : 'Low stock alert'}</p>
                      <p className="text-admin-muted mt-0.5">Fleece hoodie - XL Black (restant: 2)</p>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg hover:bg-neutral-50 transition cursor-pointer flex gap-2.5 items-start">
                    <MessageSquare className="size-4 text-[#247A52] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-black">{systemLocale === 'fr' ? 'Message WhatsApp' : 'WhatsApp message'}</p>
                      <p className="text-admin-muted mt-0.5">Alice Martin : Bonjour, où en est ma commande ?</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar (Jean Dupont) */}
        <div className="flex items-center gap-3 pl-1 border-l border-admin-border/80">
          <div className="relative size-9 rounded-full overflow-hidden bg-neutral-900 border border-admin-border">
            {/* Elegant visual placeholder for profile picture */}
            <div className="absolute inset-0 bg-neutral-800 text-white font-bold text-[10px] flex items-center justify-center uppercase">
              JD
            </div>
          </div>
          <div className="hidden lg:block text-left text-xs font-semibold">
            <p className="text-black">Jean Dupont</p>
            <p className="text-[10px] text-admin-muted mt-0.5">Administrateur</p>
          </div>
        </div>

        {/* Primary CTA: Add product button */}
        <button
          onClick={() => router.push('/produits')}
          className="h-11 px-4 sm:px-5 bg-black text-white hover:bg-neutral-800 transition font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">{systemLocale === 'fr' ? 'Ajouter un produit' : 'Add product'}</span>
        </button>

      </div>
    </header>
  );
}
