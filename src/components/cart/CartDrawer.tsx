'use client';

import { useEffect, useRef } from 'react';
import { FiLock, FiShoppingBag, FiX } from 'react-icons/fi';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/currency';
import { CartLineItem } from './CartLineItem';

type CartDrawerProps = {
  open?: boolean;
  onClose?: () => void;
  cartHref?: string;
  onQuantityChange?: (quantity: number, productId: string, size: string, color: string) => void;
  onRemove?: (productId: string, size: string, color: string) => void;
  freeShippingThreshold?: number;
  currency?: string;
  locale?: string;
};

export function CartDrawer({
  open,
  onClose,
  cartHref = '/commande/livraison',
  onQuantityChange,
  onRemove,
  currency: requestedCurrency,
  locale: requestedLocale
}: CartDrawerProps) {
  const t = useTranslations('cart');
  const systemLocale = useLocale();
  const { currency: systemCurrency } = useCurrency();
  const locale: 'fr' | 'en' = (requestedLocale ?? systemLocale).toLowerCase().startsWith('en') ? 'en' : 'fr';
  const currency: CurrencyCode = requestedCurrency === 'GBP' || requestedCurrency === 'EUR'
    ? requestedCurrency
    : systemCurrency;
  const { items, subtotalEur } = useCart();
  const { isOpen, close } = useCartDrawer();
  const activeOpen = open ?? isOpen;
  const activeOnClose = onClose ?? close;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!activeOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        activeOnClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []).filter((element) => element.getAttribute('aria-hidden') !== 'true');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [activeOpen, activeOnClose]);

  if (!activeOpen) return null;

  const title = locale === 'fr' ? 'Votre panier' : 'Your cart';
  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label={locale === 'fr' ? 'Fermer le panier en cliquant sur l’arrière-plan' : 'Close cart from backdrop'} onClick={activeOnClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cart-dialog-title" className="absolute left-1/2 top-1/2 flex max-h-[min(90dvh,760px)] w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white text-neutral-950 shadow-[0_32px_100px_rgba(0,0,0,.35)] sm:w-[calc(100%-3rem)]">
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-5 sm:px-8 sm:py-6">
          <div>
            <h2 id="cart-dialog-title" className="font-serif text-3xl tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{items.reduce((sum, item) => sum + item.quantity, 0)} {locale === 'fr' ? 'article(s)' : 'item(s)'}</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={activeOnClose} aria-label={locale === 'fr' ? 'Fermer le panier' : 'Close cart'} className="grid size-11 place-items-center rounded-full border border-neutral-300 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950">
            <FiX className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-8">
          {items.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <FiShoppingBag className="size-10 text-neutral-300" aria-hidden="true" />
              <p className="mt-4 text-neutral-500">{t('empty')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {items.map((line) => <CartLineItem key={`${line.productId}-${line.size}-${line.color}`} line={line} onQuantityChange={onQuantityChange} onRemove={onRemove} />)}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-neutral-200 bg-neutral-50 px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex items-center justify-between text-lg font-semibold sm:text-xl">
              <span>{t('subtotal')}</span><span>{formatPrice(subtotalEur, currency, locale)}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{locale === 'fr' ? 'Frais de livraison calculés à l’étape suivante.' : 'Shipping is calculated at the next step.'}</p>
            <Link href={cartHref} onClick={activeOnClose} className="mt-5 flex h-14 w-full items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold uppercase tracking-[.12em] text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2">
              {t('checkout')}
            </Link>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500"><FiLock aria-hidden="true" /> {locale === 'fr' ? 'Paiement sécurisé' : 'Secure checkout'}</p>
          </footer>
        )}
      </section>
    </div>
  );
}
