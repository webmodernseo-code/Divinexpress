'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { getProductById } from '@/lib/products';
import { Button } from '@/components/ui/Button';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export function CartDrawer() {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { isOpen, close } = useCartDrawer();
  const { items, removeItem, updateQuantity, subtotalEur } = useCart();
  const { currency } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label={t('close')} onClick={close} className="absolute inset-0 bg-ink/50" />
      <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">{t('title')}</h2>
          <button type="button" onClick={close} aria-label={t('close')} className="text-2xl leading-none">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
        ) : (
          <>
            <ul className="mt-6 flex-1 space-y-6">
              {items.map((line) => {
                const product = getProductById(line.productId);
                if (!product) return null;
                const lineKey = `${line.productId}-${line.size}-${line.color}`;
                return (
                  <li key={lineKey} className="flex gap-4">
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
              })}
            </ul>

            <div className="mt-6 border-t border-mist-100 pt-4">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(subtotalEur, currency, locale)}</span>
              </div>
              <Link href="/panier" onClick={close} className="mt-4 block">
                <Button className="w-full">{t('viewCart')}</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
