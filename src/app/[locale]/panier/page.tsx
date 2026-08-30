'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { FreeShippingProgress } from '@/components/cart/FreeShippingProgress';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { freeShippingRemainingEur } from '@/server/settings/shipping';
import {
  FiArrowLeft,
  FiLock,
  FiMinus,
  FiPackage,
  FiPlus,
  FiRefreshCcw,
  FiShield,
  FiTrash2,
  FiTruck,
} from 'react-icons/fi';

const PAYMENT_LOGOS = [
  { name: 'Visa & Mastercard', src: '/payment/visa-mastercard.png', width: 123, height: 50 },
  { name: 'PayPal', src: '/payment/paypal.png', width: 60, height: 40 },
  { name: 'Orange Money', src: '/payment/orange-money.png', width: 72, height: 28 },
  { name: 'Wave', src: '/payment/wave.png', width: 48, height: 26 }
];

export default function CartPage() {
  const t = useTranslations('cart');
  const systemLocale = useLocale() as 'fr' | 'en';
  const { items, subtotalEur, updateQuantity, removeItem } = useCart();
  const { currency } = useCurrency();
  const settings = useStoreSettings();
  const freeShippingThreshold = settings.free_shipping_threshold_minor / 100;

  const activeLocale = systemLocale === 'fr' ? 'fr-FR' : 'en-GB';

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(activeLocale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }),
    [activeLocale, currency]
  );

  const amountRemaining = freeShippingRemainingEur(subtotalEur, settings.free_shipping_threshold_minor);

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main className="min-h-screen bg-white px-5 py-12 text-black sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex items-baseline gap-4">
          <h1 className="font-serif text-[44px] leading-none tracking-[-0.04em] sm:text-6xl">
            {systemLocale === 'fr' ? 'Votre panier' : 'Your basket'}
          </h1>
          <span className="text-sm text-neutral-500">
            {totalItemsCount} {totalItemsCount > 1 ? (systemLocale === 'fr' ? 'articles' : 'items') : (systemLocale === 'fr' ? 'article' : 'item')}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="mt-12 py-16 text-center bg-neutral-50 rounded-2xl border border-neutral-200 max-w-lg mx-auto">
            <p className="text-lg text-neutral-500 font-medium">{t('empty')}</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-3 text-sm font-bold text-accent underline hover:text-black transition-colors"
            >
              <FiArrowLeft className="size-4" aria-hidden="true" />
              {systemLocale === 'fr' ? 'Retour aux achats' : 'Continue shopping'}
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.85fr)] lg:items-start lg:gap-14">
            <div>
              {/* Shipping Progress bar */}
              <section className={`rounded-2xl p-5 sm:p-7 border border-neutral-100 transition-colors duration-500 ${amountRemaining <= 0 ? 'bg-amber-50/25 border-amber-200' : 'bg-neutral-100'}`}>
                <div className="flex items-center gap-3">
                  <FiPackage className={`size-5 shrink-0 transition-all ${amountRemaining <= 0 ? 'text-amber-500 animate-bounce' : 'text-neutral-500'}`} aria-hidden="true" />
                  <p className={`text-sm sm:text-base font-semibold transition-colors ${amountRemaining <= 0 ? 'text-amber-800' : 'text-ink'}`}>
                    {amountRemaining > 0 ? (
                      systemLocale === 'fr' ? (
                        <>Plus que <span className="font-bold text-black">{formatter.format(amountRemaining)}</span> pour obtenir la livraison offerte</>
                      ) : (
                        <>You&apos;re <span className="font-bold text-black">{formatter.format(amountRemaining)}</span> away from free delivery</>
                      )
                    ) : (
                      systemLocale === 'fr' ? 'Félicitations ! Livraison offerte débloquée ! 🎉' : 'Congratulations! You unlocked free delivery! 🎉'
                    )}
                  </p>
                </div>

                <FreeShippingProgress
                  subtotalEur={subtotalEur}
                  threshold={freeShippingThreshold}
                  className="mt-5"
                />
                <p className="mt-3 flex items-center justify-between text-xs text-neutral-500 font-medium">
                  <span>{formatter.format(subtotalEur)}</span>
                  <span>{formatter.format(freeShippingThreshold)}</span>
                </p>
              </section>

              {/* Items List */}
              <div className="divide-y divide-neutral-200">
                {items.map((line) => {
                  if (!line.name || !line.imageUrl) return null;
                  const lineKey = `${line.productId}-${line.size}-${line.color}`;
                  const productImage = line.imageUrl;
                  const itemSubtotal = (line.unitPriceEur ?? 0) * line.quantity;

                  return (
                    <article key={lineKey} className="grid grid-cols-[112px_minmax(0,1fr)] gap-5 py-7 sm:grid-cols-[190px_minmax(0,1fr)_auto] sm:gap-8 bg-transparent">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
                        <Image
                          src={productImage}
                          alt={line.name[systemLocale]}
                          fill
                          sizes="(max-width: 640px) 112px, 190px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 py-1 flex flex-col justify-between">
                        <div>
                          <h2 className="text-lg font-medium sm:text-xl text-black leading-tight">{line.name[systemLocale]}</h2>
                          <p className="mt-1 text-sm text-neutral-500 sm:text-base">
                            {line.size} · {line.color}
                          </p>
                          <p className="mt-4 font-medium sm:hidden">
                            {formatter.format(itemSubtotal)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-5">
                          <div className="inline-flex h-11 items-center rounded-full border border-neutral-355" style={{ borderColor: '#d4d4d4' }}>
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={line.quantity <= 1}
                              onClick={() => updateQuantity(line.productId, line.size, line.color, Math.max(1, line.quantity - 1))}
                              className="grid h-full w-11 place-items-center rounded-l-full transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <FiMinus className="size-4" aria-hidden="true" />
                            </button>
                            <output className="min-w-8 text-center text-sm font-medium" aria-label="Quantity">
                              {line.quantity}
                            </output>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => updateQuantity(line.productId, line.size, line.color, line.quantity + 1)}
                              className="grid h-full w-11 place-items-center rounded-r-full transition hover:bg-neutral-100"
                            >
                              <FiPlus className="size-4" aria-hidden="true" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(line.productId, line.size, line.color)}
                            className="flex items-center gap-2 text-sm text-neutral-500 underline decoration-neutral-400 underline-offset-4 transition hover:text-black"
                          >
                            <FiTrash2 className="size-4" aria-hidden="true" />
                            {systemLocale === 'fr' ? 'Retirer' : 'Remove'}
                          </button>
                        </div>
                      </div>

                      <p className="hidden pt-2 text-lg font-medium sm:block">
                        {formatter.format(itemSubtotal)}
                      </p>
                    </article>
                  );
                })}
              </div>

              <Link
                href="/"
                className="mt-7 inline-flex items-center gap-3 text-sm underline-offset-4 hover:underline"
              >
                <FiArrowLeft className="size-4" aria-hidden="true" />
                {systemLocale === 'fr' ? 'Continuer mes achats' : 'Continue shopping'}
              </Link>
            </div>

            {/* Sidebar Summary */}
            <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8 lg:sticky lg:top-8 shadow-xs">
              <h2 className="font-serif text-3xl tracking-[-0.025em]">
                {systemLocale === 'fr' ? 'Résumé de la commande' : 'Order summary'}
              </h2>

              <dl className="mt-7 space-y-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>{t('subtotal')}</dt>
                  <dd>{formatter.format(subtotalEur)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{systemLocale === 'fr' ? 'Livraison' : 'Delivery'}</dt>
                  <dd className="text-right text-neutral-500">
                    {systemLocale === 'fr' ? 'Calculée à l\'étape suivante' : 'Calculated at checkout'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-neutral-200 pt-5 text-lg font-medium">
                  <dt>Total</dt>
                  <dd>{formatter.format(subtotalEur)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-neutral-500">
                {systemLocale === 'fr' ? 'Taxes incluses.' : 'Taxes included.'}
              </p>

              <Link
                href="/commande/livraison"
                className="mt-7 flex h-14 w-full items-center justify-center rounded-lg bg-black text-sm font-semibold tracking-[0.11em] text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2"
              >
                {t('checkout').toUpperCase()}
              </Link>

              <p className="mt-5 flex items-center justify-center gap-2 text-xs text-neutral-500">
                <FiLock className="size-4" aria-hidden="true" />
                {systemLocale === 'fr' ? 'Paiement sécurisé' : 'Secure checkout'}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
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

              <p className="mt-5 text-center text-xs text-neutral-500">
                {systemLocale === 'fr' ? 'Retours gratuits sous 14 jours' : 'Free returns within 14 days'}
              </p>
            </aside>
          </div>
        )}

        <section className="mt-14 grid divide-y divide-neutral-200 border-y border-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 bg-neutral-50/50 rounded-2xl">
          {[
            { icon: FiShield, text: systemLocale === 'fr' ? 'Paiements 100% sécurisés' : 'Secure payments' },
            { icon: FiTruck, text: systemLocale === 'fr' ? 'Livraison offerte dès 150€' : 'Free delivery over €150' },
            { icon: FiRefreshCcw, text: systemLocale === 'fr' ? 'Retours simples sous 14 jours' : 'Easy returns' }
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-3 px-5 py-7 text-sm">
              <span className="grid size-11 place-items-center rounded-full border border-neutral-200 bg-white">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              {text}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
