'use client';

import Image from 'next/image';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useLocale } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import type { CartItem } from '@/lib/cart';

type CartLineItemProps = {
  line: CartItem;
  onQuantityChange?: (quantity: number, productId: string, size: string, color: string) => void;
  onRemove?: (productId: string, size: string, color: string) => void;
};

export function CartLineItem({ line, onQuantityChange, onRemove }: CartLineItemProps) {
  const locale = useLocale() as 'fr' | 'en';
  const { currency } = useCurrency();
  const { removeItem, updateQuantity } = useCart();
  if (!line.name || !line.imageUrl) return null;

  const name = line.name[locale];
  const unitPrice = line.unitPriceEur ?? 0;
  const setQuantity = (quantity: number) => {
    const nextQuantity = Math.max(1, quantity);
    updateQuantity(line.productId, line.size, line.color, nextQuantity);
    onQuantityChange?.(nextQuantity, line.productId, line.size, line.color);
  };

  return (
    <li className="grid grid-cols-[88px_1fr] gap-4 py-5 sm:grid-cols-[116px_1fr] sm:gap-6">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
        <Image src={line.imageUrl} alt={name} fill sizes="(max-width: 640px) 88px, 116px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg leading-tight text-neutral-950 sm:text-xl">{name}</h3>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 sm:text-sm">
              <span>{locale === 'fr' ? 'Taille' : 'Size'} {line.size}</span>
              <span>{locale === 'fr' ? 'Couleur' : 'Colour'} {line.color}</span>
            </div>
          </div>
          <strong className="shrink-0 text-sm sm:text-base">{formatPrice(unitPrice * line.quantity, currency, locale)}</strong>
        </div>
        <p className="mt-2 text-xs text-neutral-500">{formatPrice(unitPrice, currency, locale)} / {locale === 'fr' ? 'unité' : 'unit'}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex h-10 items-center overflow-hidden rounded-full border border-neutral-300 bg-white">
            <button type="button" disabled={line.quantity <= 1} onClick={() => setQuantity(line.quantity - 1)} aria-label={`${locale === 'fr' ? 'Diminuer la quantité de' : 'Decrease quantity of'} ${name}`} className="grid h-full w-10 place-items-center transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35">
              <FiMinus aria-hidden="true" />
            </button>
            <output aria-label={locale === 'fr' ? `Quantité de ${name}` : `Quantity of ${name}`} className="min-w-8 text-center text-sm font-semibold">{line.quantity}</output>
            <button type="button" onClick={() => setQuantity(line.quantity + 1)} aria-label={`${locale === 'fr' ? 'Augmenter la quantité de' : 'Increase quantity of'} ${name}`} className="grid h-full w-10 place-items-center transition hover:bg-neutral-100">
              <FiPlus aria-hidden="true" />
            </button>
          </div>
          <button type="button" onClick={() => { removeItem(line.productId, line.size, line.color); onRemove?.(line.productId, line.size, line.color); }} className="inline-flex items-center gap-1.5 text-xs text-neutral-500 underline underline-offset-4 transition hover:text-neutral-950">
            <FiTrash2 aria-hidden="true" /> {locale === 'fr' ? 'Retirer' : 'Remove'}
          </button>
        </div>
      </div>
    </li>
  );
}
