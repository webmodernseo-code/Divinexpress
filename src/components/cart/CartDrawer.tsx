'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { CartLineItem } from './CartLineItem';

export function CartDrawer() {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { isOpen, close } = useCartDrawer();
  const { items, subtotalEur } = useCart();
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
              {items.map((line) => (
                <CartLineItem key={`${line.productId}-${line.size}-${line.color}`} line={line} />
              ))}
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
