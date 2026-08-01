'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { COLOR_SWATCHES, type Product } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatPrice } from '@/lib/currency';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductTabs } from '@/components/product/ProductTabs';
import { SizeGuideModal } from '@/components/product/SizeGuideModal';
import { KIDS_ROWS } from '@/components/product/SizeGuideTable';

/** Shipping funnel (Tâche 19) — not built yet, 404 for now. */
const CHECKOUT_PATH = '/commande/livraison';

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function FieldLabel({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between text-[13px] font-bold">
      <span>{label}</span>
      {value && <span className="font-semibold text-mist-600">{value}</span>}
    </div>
  );
}

export function ProductDetailView({
  product,
  relatedProducts
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const locale = useLocale() as 'fr' | 'en';
  const t = useTranslations('product');
  const router = useRouter();
  const { currency } = useCurrency();
  const { addItem } = useCart();
  const { open: openCartDrawer } = useCartDrawer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);

  const favorite = isFavorite(product.id);

  function handleAddToCart() {
    addItem({ productId: product.id, size, color, quantity });
    openCartDrawer();
  }

  /** Same line added to the cart, but jumps straight to checkout instead of the drawer. */
  function handleBuyNow() {
    addItem({ productId: product.id, size, color, quantity });
    router.push(CHECKOUT_PATH);
  }

  return (
    <div>
      <div className="grid gap-9 md:grid-cols-2 md:gap-14">
        <ProductGallery imageCount={product.imageCount} productName={product.name[locale]} />

        <div>
          <h1 className="font-serif text-2xl md:text-[32px]">{product.name[locale]}</h1>
          <p className="mt-2.5 text-lg font-bold">{formatPrice(product.priceEur, currency, locale)}</p>

          <div className="mt-7">
            <FieldLabel
              label={t('size')}
              value={
                product.category === 'enfant'
                  ? `${size} · ${KIDS_ROWS.find((row) => row.size === size)?.age} ${t('yearsAbbr')}`
                  : size
              }
            />
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((option) => {
                const isActive = option === size;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    aria-pressed={isActive}
                    className={`h-[46px] min-w-[46px] rounded-full border px-3.5 text-[13px] font-bold transition-colors ${
                      isActive ? 'border-ink bg-ink text-paper' : 'border-mist-100 bg-paper text-ink hover:border-accent'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <div className="mt-2">
              <SizeGuideModal category={product.category} oneSizeLabel={t('oneSize')} />
            </div>
          </div>

          <div className="mt-7">
            <FieldLabel label={t('color')} value={color} />
            <div className="flex gap-3">
              {product.colors.map((option) => {
                const isActive = option === color;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    aria-label={option}
                    aria-pressed={isActive}
                    className={`h-[34px] w-[34px] rounded-full border-2 p-[3px] transition-colors ${
                      isActive ? 'border-accent' : 'border-transparent hover:border-mist-300'
                    }`}
                  >
                    <span
                      className="block h-full w-full rounded-full border border-mist-100"
                      style={{ backgroundColor: COLOR_SWATCHES[option] ?? '#ffffff' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7">
            <FieldLabel label={t('quantity')} />
            <div className="inline-flex items-center overflow-hidden rounded-full border border-mist-100">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                aria-label={t('decreaseQuantity')}
                className="flex h-10 w-10 items-center justify-center text-base transition-colors hover:text-accent"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                aria-label={t('increaseQuantity')}
                className="flex h-10 w-10 items-center justify-center text-base transition-colors hover:text-accent"
              >
                +
              </button>
            </div>
          </div>

          {/* On mobile the favorite button sits left of the full-width primary action. */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className="order-2 flex-1 rounded-2xl bg-ink px-6 py-4 text-sm font-bold tracking-wide text-paper transition-colors hover:bg-accent md:order-1"
            >
              {t('addToCart')}
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              aria-pressed={favorite}
              aria-label={t('toggleFavorite')}
              className={`order-1 flex h-[54px] w-[54px] flex-shrink-0 items-center justify-center rounded-full border transition-colors md:order-2 ${
                favorite ? 'border-accent text-accent' : 'border-mist-100 text-ink hover:border-accent hover:text-accent'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill={favorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBuyNow}
            className="mt-3 w-full rounded-2xl border border-ink px-6 py-4 text-sm font-bold tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            {t('buyNow')}
          </button>

          <ProductTabs description={product.description[locale]} category={product.category} />

          <div className="mt-6 flex flex-col items-start gap-2.5 rounded-2xl border border-mist-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-sm text-mist-600">{t('needHelp')}</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 text-sm font-bold text-ink transition-colors hover:text-accent"
            >
              {t('contactUs')}
              <ChevronRightIcon />
            </Link>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-14 md:mt-20">
          <Heading level={2}>{t('relatedProducts')}</Heading>
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-7">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
