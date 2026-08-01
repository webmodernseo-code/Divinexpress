'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { CATEGORIES, getSubcategoriesForCategory, type Category } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Logo } from '@/components/ui/Logo';
import { SOCIAL_LINKS } from '@/components/ui/SocialIcons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

const ICON_CIRCLE_CLASS =
  'relative grid size-11 place-items-center rounded-full border border-[#DDD8CF] text-[#0B0B0B] transition-colors hover:bg-[#F1EDE5]';
const ICON_SVG_CLASS = 'size-5';
const ICON_BADGE_CLASS = 'absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#0B0B0B] text-[10px] font-semibold text-white';

function HeartIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

function BagIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function MenuIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function HeaderIcons({
  favoritesLabel,
  cartLabel,
  searchLabel,
  favoriteCount,
  cartCount,
  onSearchToggle,
  onOpenCart,
  onNavigate
}: {
  favoritesLabel: string;
  cartLabel: string;
  searchLabel: string;
  favoriteCount: number;
  cartCount: number;
  onSearchToggle: () => void;
  onOpenCart: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onSearchToggle} aria-label={searchLabel} className={ICON_CIRCLE_CLASS}>
        <SearchIcon className={ICON_SVG_CLASS} />
      </button>
      <Link href="/favoris" aria-label={favoritesLabel} onClick={onNavigate} className={ICON_CIRCLE_CLASS}>
        <HeartIcon className={ICON_SVG_CLASS} />
        {favoriteCount > 0 && (
          <span className={`${ICON_BADGE_CLASS} tabular-nums`}>{favoriteCount}</span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => {
          onOpenCart();
          onNavigate?.();
        }}
        aria-label={cartLabel}
        className={ICON_CIRCLE_CLASS}
      >
        <BagIcon className={ICON_SVG_CLASS} />
        {cartCount > 0 && (
          <span className={`${ICON_BADGE_CLASS} tabular-nums`}>{cartCount}</span>
        )}
      </button>
    </div>
  );
}

export function Header() {
  const t = useTranslations('nav');
  const tHeader = useTranslations('header');
  const router = useRouter();
  const { itemCount } = useCart();
  const { open: openCartDrawer } = useCartDrawer();
  const { favoriteIds } = useFavorites();

  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMobileCategory, setOpenMobileCategory] = useState<Category | null>(null);

  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (openCategory === null) return;
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenCategory(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openCategory]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenCategory(null);
        setIsSearchOpen(false);
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setIsSearchOpen(false);
      setIsMenuOpen(false);
      router.push(`/recherche?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function openMobileMenu() {
    setIsSearchOpen(false);
    setOpenCategory(null);
    setIsMenuOpen(true);
  }

  function closeMobileMenu() {
    setIsMenuOpen(false);
    setOpenMobileCategory(null);
  }

  return (
    <header className="sticky top-0 z-50 bg-paper text-ink">
      {/* Utility bar */}
      <div className="flex items-center justify-between gap-3 bg-mist-800 px-4 py-2 text-xs text-paper sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map(({ label, Icon }) => (
            <a key={label} href="#" aria-label={label} className="inline-flex text-paper/85 transition-colors hover:text-accent hover:opacity-100">
              <Icon className="h-[15px] w-[15px]" />
            </a>
          ))}
        </div>
        <p className="hidden flex-1 text-center tracking-wide sm:block">{tHeader('freeShippingBanner')}</p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <CurrencySwitcher />
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-mist-100">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 md:py-4">
          {/* Desktop row */}
          <div className="hidden items-center justify-between gap-6 md:flex">
            <Logo />
            <nav ref={navRef} className="flex items-center gap-1 text-sm font-bold tracking-wide">
              {CATEGORIES.map((category) => {
                const isOpen = openCategory === category;
                const subcategories = getSubcategoriesForCategory(category);
                return (
                  <div key={category} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenCategory(isOpen ? null : category)}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      className={`flex items-center gap-1.5 px-3 py-2 transition-colors hover:text-accent ${isOpen ? 'text-accent' : 'text-ink'}`}
                    >
                      {t(category)}
                      <ChevronIcon className={`h-[11px] w-[11px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="absolute left-1/2 top-full z-20 flex min-w-[180px] -translate-x-1/2 flex-col rounded-3xl border border-mist-100 bg-paper py-3.5 shadow-lg">
                        <Link
                          href={{ pathname: '/', query: { categorie: category } }}
                          onClick={() => setOpenCategory(null)}
                          className="mb-1.5 border-b border-mist-100 px-5 pb-2.5 text-sm font-bold text-ink hover:text-accent"
                        >
                          {t('viewAll')}
                        </Link>
                        {subcategories.map((sub) => (
                          <Link
                            key={sub}
                            href={{ pathname: '/', query: { categorie: category, sousCategorie: sub } }}
                            onClick={() => setOpenCategory(null)}
                            className="px-5 py-2 text-sm font-semibold capitalize text-mist-600 hover:text-accent"
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            <HeaderIcons
              favoritesLabel={t('favorites')}
              cartLabel={t('cart')}
              searchLabel={t('search')}
              favoriteCount={favoriteIds.length}
              cartCount={itemCount}
              onSearchToggle={() => setIsSearchOpen((open) => !open)}
              onOpenCart={openCartDrawer}
            />
          </div>

          {/* Mobile row */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={openMobileMenu}
              aria-label={t('menu')}
              aria-expanded={isMenuOpen}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-2xl border-[1.5px] border-ink bg-paper text-ink"
            >
              <MenuIcon className="h-[18px] w-[18px]" />
            </button>
            <div className="flex justify-center">
              <Logo />
            </div>
            <HeaderIcons
              favoritesLabel={t('favorites')}
              cartLabel={t('cart')}
              searchLabel={t('search')}
              favoriteCount={favoriteIds.length}
              cartCount={itemCount}
              onSearchToggle={() => setIsSearchOpen((open) => !open)}
              onOpenCart={openCartDrawer}
            />
          </div>
        </div>

        {isSearchOpen && (
          <div className="border-t border-mist-100 px-4 py-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-7xl items-center gap-4">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('search')}
                aria-label={t('search')}
                autoFocus
                className="flex-1 border-0 border-b-2 border-ink bg-transparent py-1.5 text-lg font-bold text-ink placeholder:text-mist-400 focus:border-accent focus:outline-none md:text-xl"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label={t('closeSearch')}
                className="inline-flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-2xl bg-ink text-paper"
              >
                <CloseIcon className="h-[15px] w-[15px]" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button type="button" aria-label={t('closeMenu')} className="absolute inset-0 bg-ink/40" onClick={closeMobileMenu} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-paper shadow-2xl">
            <div className="relative flex items-center border-b border-mist-100 px-5 py-4">
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label={t('closeMenu')}
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-2xl border-[1.5px] border-ink bg-paper text-ink"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2">
                <Logo />
              </div>
            </div>
            <nav className="flex-1 px-5 pt-2">
              {CATEGORIES.map((category) => {
                const isOpen = openMobileCategory === category;
                const subcategories = getSubcategoriesForCategory(category);
                return (
                  <div key={category} className="border-b border-mist-100">
                    <button
                      type="button"
                      onClick={() => setOpenMobileCategory(isOpen ? null : category)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between py-4 text-left text-[17px] font-bold text-ink"
                    >
                      {t(category)}
                      <ChevronIcon
                        className={`h-[13px] w-[13px] flex-shrink-0 text-mist-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="flex flex-col gap-1 pb-4 pl-1">
                        <Link
                          href={{ pathname: '/', query: { categorie: category } }}
                          onClick={closeMobileMenu}
                          className="py-1.5 text-sm font-semibold text-ink"
                        >
                          {t('viewAll')}
                        </Link>
                        {subcategories.map((sub) => (
                          <Link
                            key={sub}
                            href={{ pathname: '/', query: { categorie: category, sousCategorie: sub } }}
                            onClick={closeMobileMenu}
                            className="py-1.5 text-sm font-semibold capitalize text-mist-600 hover:text-accent"
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
