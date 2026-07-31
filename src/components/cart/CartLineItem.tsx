'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import { getProductById } from '@/lib/products';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';
import type { CartItem } from '@/lib/cart';

export function CartLineItem({ line }: { line: CartItem }) {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { currency } = useCurrency();
  const { removeItem, updateQuantity } = useCart();
  const product = getProductById(line.productId);
  if (!product) return null;

  const lineKey = `${line.productId}-${line.size}-${line.color}`;

  return (
    <li className="flex gap-4">
      <PlaceholderBlock aspect="square" className="w-20 flex-shrink-0" />
      <div className="flex flex-1 flex-col text-sm">
        <span className="font-medium">{product.name[locale]}</span>
        <span className="text-mist-500">
          {line.size} · {line.color}
        </span>
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor={`qty-${lineKey}`} className="sr-only">
            {t('quantity')}
          </label>
          <input
            id={`qty-${lineKey}`}
            type="number"
            min={1}
            value={line.quantity}
            onChange={(event) =>
              updateQuantity(line.productId, line.size, line.color, Math.max(1, Number(event.target.value)))
            }
            className="w-14 border border-mist-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => removeItem(line.productId, line.size, line.color)}
            className="text-xs text-mist-500 underline hover:text-accent"
          >
            {t('remove')}
          </button>
        </div>
        <span className="mt-2 text-sm">{formatPrice(product.priceEur * line.quantity, currency, locale)}</span>
      </div>
    </li>
  );
}
