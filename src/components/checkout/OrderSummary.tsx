'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import type { CartItem } from '@/lib/cart';
import { formatPrice } from '@/lib/currency';
import { useCurrency } from '@/context/CurrencyContext';

export function OrderSummary({
  items,
  subtotalEur,
  className = ''
}: {
  items: CartItem[];
  subtotalEur: number;
  className?: string;
}) {
  const rawLocale = useLocale();
  const locale = rawLocale === 'en' ? 'en' : 'fr';
  const { currency } = useCurrency();

  return (
    <section
      aria-labelledby="order-summary-title"
      className={`rounded-3xl border border-mist-100 bg-paper p-5 shadow-sm sm:p-6 ${className}`}
    >
      <h2 id="order-summary-title" className="font-heading text-xl font-bold text-ink">
        {locale === 'fr' ? 'Récapitulatif de la commande' : 'Order summary'}
      </h2>

      <ul className="mt-5 divide-y divide-mist-100">
        {items.map((item) => {
          const name = item.name?.[locale] ?? item.name?.fr ?? item.productId;
          const unitPrice = item.unitPriceEur ?? 0;

          return (
            <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 py-4 first:pt-0">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-mist-50">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate text-sm font-bold text-ink">{name}</h3>
                  <strong className="shrink-0 text-sm text-ink">
                    {formatPrice(unitPrice * item.quantity, currency, locale)}
                  </strong>
                </div>
                <p className="mt-2 text-xs text-mist-600">
                  {locale === 'fr' ? 'Taille' : 'Size'} : {item.size}
                </p>
                <p className="mt-1 text-xs text-mist-600">
                  {locale === 'fr' ? 'Couleur' : 'Color'} : {item.color}
                </p>
                <p className="mt-1 text-xs font-medium text-mist-700">
                  {locale === 'fr' ? 'Quantité' : 'Quantity'} : {item.quantity}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-1 flex items-center justify-between border-t border-mist-200 pt-5 text-base font-bold text-ink">
        <span>{locale === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
        <span>{formatPrice(subtotalEur, currency, locale)}</span>
      </div>
    </section>
  );
}
