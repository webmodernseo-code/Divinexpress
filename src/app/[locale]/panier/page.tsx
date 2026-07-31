'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CartLineItem } from '@/components/cart/CartLineItem';

export default function CartPage() {
  const t = useTranslations('cart');
  const locale = useLocale() as 'fr' | 'en';
  const { items, subtotalEur } = useCart();
  const { currency } = useCurrency();

  return (
    <Container className="py-10 md:py-14">
      <Heading level={1}>{t('title')}</Heading>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-mist-600">{t('empty')}</p>
      ) : (
        <div className="mt-7 grid gap-10 md:mt-10 md:grid-cols-3 md:gap-12">
          <ul className="space-y-8 md:col-span-2">
            {items.map((line) => (
              <CartLineItem key={`${line.productId}-${line.size}-${line.color}`} line={line} />
            ))}
          </ul>

          <div className="border-t border-mist-100 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <div className="flex justify-between text-sm">
              <span>{t('subtotal')}</span>
              <span>{formatPrice(subtotalEur, currency, locale)}</span>
            </div>
            <Link href="/commande/livraison" className="mt-6 block">
              <Button className="w-full">{t('checkout')}</Button>
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
