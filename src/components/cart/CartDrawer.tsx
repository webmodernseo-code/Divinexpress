'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  FiLock,
  FiMinus,
  FiPackage,
  FiPlus,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

type CartDrawerProps = {
  open?: boolean;
  onClose?: () => void;
  freeShippingThreshold?: number;
  currency?: string;
  locale?: string;
  cartHref?: string;
  onQuantityChange?: (quantity: number, productId: string, size: string, color: string) => void;
  onRemove?: (productId: string, size: string, color: string) => void;
};

const PAYMENT_LOGOS = [
  { name: 'Visa & Mastercard', src: '/payment/visa-mastercard.png', width: 123, height: 50 },
  { name: 'PayPal', src: '/payment/paypal.png', width: 60, height: 40 },
  { name: 'Orange Money', src: '/payment/orange-money.png', width: 72, height: 28 },
  { name: 'Wave', src: '/payment/wave.png', width: 48, height: 26 }
];

export function CartDrawer({
  open,
  onClose,
  freeShippingThreshold = 150,
  currency: propCurrency,
  locale: propLocale,
  cartHref = '/panier',
  onQuantityChange,
  onRemove
}: CartDrawerProps) {
  const t = useTranslations('cart');
  const systemLocale = useLocale() as 'fr' | 'en';
  const { currency: systemCurrency } = useCurrency();
  const { items, subtotalEur, removeItem, updateQuantity } = useCart();
  const { isOpen: globalIsOpen, close: globalClose } = useCartDrawer();

  // Use props if supplied, otherwise fallback to context
  const activeOpen = open !== undefined ? open : globalIsOpen;
  const activeOnClose = onClose !== undefined ? onClose : globalClose;
  const activeCurrency = propCurrency || systemCurrency;
  const activeLocale = propLocale || (systemLocale === 'fr' ? 'fr-FR' : 'en-GB');

  useEffect(() => {
    if (!activeOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') activeOnClose();
    };

    window.addEventListener('keydown', closeWithEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeWithEscape);
    };
  }, [activeOpen, activeOnClose]);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(activeLocale, {
        style: 'currency',
        currency: activeCurrency,
        minimumFractionDigits: 2
      }),
    [activeCurrency, activeLocale]
  );

  const amountRemaining = Math.max(freeShippingThreshold - subtotalEur, 0);
  const shippingProgress = Math.min((subtotalEur / freeShippingThreshold) * 100, 100);

  return (
    <div
      className={`fixed inset-0 z-50 transition-[visibility] duration-300 ${
        activeOpen ? 'visible' : 'invisible'
      }`}
      aria-hidden={!activeOpen}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close basket"
        onClick={activeOnClose}
        className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-300 ${
          activeOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`absolute inset-y-0 right-0 flex h-dvh w-full flex-col bg-white text-black shadow-[-20px_0_60px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out sm:max-w-[580px] ${
          activeOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex items-baseline gap-4">
            <h2
              id="cart-drawer-title"
              className="font-serif text-[38px] leading-none tracking-[-0.035em] sm:text-[44px]"
            >
              {systemLocale === 'fr' ? 'Votre panier' : 'Your basket'}
            </h2>
            <span className="text-sm text-neutral-500">
              {items.length} {items.length > 1 ? (systemLocale === 'fr' ? 'articles' : 'items') : (systemLocale === 'fr' ? 'article' : 'item')}
            </span>
          </div>

          <button
            type="button"
            onClick={activeOnClose}
            aria-label="Close basket"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-neutral-300 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          >
            <FiX className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Free Shipping Progress */}
          <section className={`border-b border-neutral-200 px-5 py-6 sm:px-8 transition-colors duration-500 ${amountRemaining <= 0 ? 'bg-amber-50/25' : 'bg-transparent'}`}>
            <div className="flex items-center gap-3">
              <FiPackage className={`size-5 shrink-0 transition-all ${amountRemaining <= 0 ? 'text-amber-500 animate-bounce' : 'text-neutral-500'}`} aria-hidden="true" />
              <p className={`text-sm sm:text-[15px] font-semibold transition-colors ${amountRemaining <= 0 ? 'text-amber-800' : 'text-ink'}`}>
                {amountRemaining > 0 ? (
                  systemLocale === 'fr' ? (
                    <>Plus que <span className="font-bold text-black">{formatter.format(amountRemaining)}</span> pour la livraison offerte</>
                  ) : (
                    <>You&apos;re <span className="font-bold text-black">{formatter.format(amountRemaining)}</span> away from free delivery</>
                  )
                ) : (
                  systemLocale === 'fr' ? 'Félicitations ! Livraison offerte débloquée ! 🎉' : 'Congratulations! You unlocked free delivery! 🎉'
                )}
              </p>
            </div>

            <div
              className="mt-5 h-2.5 overflow-hidden rounded-full bg-neutral-200 shadow-inner"
              role="progressbar"
              aria-label="Free delivery progress"
              aria-valuemin={0}
              aria-valuemax={freeShippingThreshold}
              aria-valuenow={Math.min(subtotalEur, freeShippingThreshold)}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${amountRemaining <= 0 ? 'shimmer-progress-unlocked' : 'shimmer-progress'}`}
                style={{ width: `${shippingProgress}%` }}
              />
            </div>

            <p className="mt-3 flex items-center justify-between text-xs text-neutral-500 font-medium">
              <span>{formatter.format(subtotalEur)}</span>
              <span>{formatter.format(freeShippingThreshold)}</span>
            </p>
          </section>

          {/* Cart items list */}
          <section className="px-5 py-2 sm:px-8 divide-y divide-neutral-200">
            {items.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-500">
                {t('empty')}
              </div>
            ) : (
              items.map((line) => {
                if (!line.name || !line.imageUrl) return null;
                const lineKey = `${line.productId}-${line.size}-${line.color}`;
                const productImage = line.imageUrl;
                const itemPrice = (line.unitPriceEur ?? 0) * line.quantity;

                return (
                  <article key={lineKey} className="grid grid-cols-[118px_1fr] gap-5 py-6 sm:grid-cols-[150px_1fr] sm:gap-7 first:pt-4">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
                      <Image
                        src={productImage}
                        alt={line.name[systemLocale]}
                        fill
                        sizes="(max-width: 640px) 118px, 150px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 py-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-medium sm:text-xl text-ink leading-tight">{line.name[systemLocale]}</h3>
                        <p className="mt-1 text-sm text-neutral-500 sm:text-base">
                          {line.size} · {line.color}
                        </p>
                        <p className="mt-3 text-lg font-medium text-ink">
                          {formatter.format(itemPrice)}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="inline-flex h-11 items-center rounded-full border border-neutral-300">
                          <button
                            type="button"
                            onClick={() => {
                              const nextQty = Math.max(1, line.quantity - 1);
                              updateQuantity(line.productId, line.size, line.color, nextQty);
                              onQuantityChange?.(nextQty, line.productId, line.size, line.color);
                            }}
                            disabled={line.quantity <= 1}
                            aria-label="Decrease quantity"
                            className="grid h-full w-11 place-items-center rounded-l-full transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <FiMinus className="size-4" aria-hidden="true" />
                          </button>
                          <output
                            aria-label="Quantity"
                            className="min-w-8 text-center text-sm font-medium"
                          >
                            {line.quantity}
                          </output>
                          <button
                            type="button"
                            onClick={() => {
                              const nextQty = line.quantity + 1;
                              updateQuantity(line.productId, line.size, line.color, nextQty);
                              onQuantityChange?.(nextQty, line.productId, line.size, line.color);
                            }}
                            aria-label="Increase quantity"
                            className="grid h-full w-11 place-items-center rounded-r-full transition hover:bg-neutral-100"
                          >
                            <FiPlus className="size-4" aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            removeItem(line.productId, line.size, line.color);
                            onRemove?.(line.productId, line.size, line.color);
                          }}
                          className="flex items-center gap-2 text-sm text-neutral-500 underline decoration-neutral-400 underline-offset-4 transition hover:text-black"
                        >
                          <FiTrash2 className="size-4" aria-hidden="true" />
                          {systemLocale === 'fr' ? 'Retirer' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-neutral-200 py-4 text-xs text-neutral-500">
          <FiLock className="size-4" aria-hidden="true" />
          {systemLocale === 'fr' ? 'Paiement sécurisé' : 'Secure checkout'}
        </div>

        {items.length > 0 && (
          <footer className="shrink-0 border-t border-neutral-200 bg-neutral-50 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pb-6">
            <div className="flex items-center justify-between text-lg font-medium">
              <span>{t('subtotal')}</span>
              <span>{formatter.format(subtotalEur)}</span>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              {systemLocale === 'fr'
                ? 'Taxes et frais de port calculés au moment de la commande.'
                : 'Taxes and shipping calculated at checkout.'}
            </p>

            <Link
              href={cartHref}
              onClick={activeOnClose}
              className="mt-5 flex h-14 w-full items-center justify-center rounded-lg bg-black text-sm font-semibold tracking-[0.14em] text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/35 focus-visible:ring-offset-2"
            >
              {t('viewCart').toUpperCase()}
            </Link>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {PAYMENT_LOGOS.map((payment) => (
                <div
                  key={payment.name}
                  className="grid h-10 min-w-14 place-items-center rounded-md border border-neutral-200 bg-white px-2 shadow-xs"
                >
                  <Image
                    src={payment.src}
                    alt={payment.name}
                    width={payment.width}
                    height={payment.height}
                    className="max-h-6 w-auto object-contain"
                  />
                </div>
              ))}
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
              <FiLock className="size-3.5" aria-hidden="true" />
              {systemLocale === 'fr' ? 'Paiements sécurisés' : 'Secure payments'}
            </p>
          </footer>
        )}
      </aside>
    </div>
  );
}
