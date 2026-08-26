'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { COLOR_SWATCHES, getProductImageUrl, type Product } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatPrice } from '@/lib/currency';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale() as 'fr' | 'en';
  const t = useTranslations('product');
  const { currency } = useCurrency();
  const { addItem } = useCart();
  const { open: openCartDrawer } = useCartDrawer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      imageUrl: product.images?.[0] ?? getProductImageUrl(product, selectedColor),
      size: product.sizes[0],
      color: selectedColor,
      quantity: 1,
      unitPriceEur: product.priceEur
    });
    openCartDrawer();
  }

  return (
    <div className="group relative">
      <div className="relative">
        <Link href={`/produit/${product.slug}?couleur=${encodeURIComponent(selectedColor)}`} className="block">
          <PlaceholderBlock
            aspect="portrait"
            fit="cover"
            className="p-1.5"
            imageUrl={product.images?.[0] ?? getProductImageUrl(product, selectedColor)}
            label={product.name[locale]}
          />
        </Link>
        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-2.5 flex h-9 w-full items-center justify-center whitespace-nowrap rounded-full bg-ink px-3 text-[10px] font-semibold uppercase tracking-wide text-paper transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:absolute sm:bottom-2.5 sm:left-1/2 sm:mt-0 sm:h-8 sm:w-auto sm:-translate-x-1/2 sm:translate-y-2 sm:px-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
        >
          {t('addToCart')}
        </button>
      </div>
      <Link href={`/produit/${product.slug}?couleur=${encodeURIComponent(selectedColor)}`} className="block">
        <div className="mt-3.5">
          <h3 className="text-sm font-semibold">{product.name[locale]}</h3>
          <p className="mt-1 text-sm">
            <span className="font-bold text-ink">{formatPrice(product.priceEur, currency, locale)}</span>
            {product.compareAtEur && product.compareAtEur > product.priceEur && (
              <span className="ml-2 text-red-400 line-through">{formatPrice(product.compareAtEur, currency, locale)}</span>
            )}
          </p>
        </div>
      </Link>
      <div className="mt-3 flex items-center gap-2">
        {product.colors.map((col) => {
          const isActive = col === selectedColor;
          return (
            <button
              key={col}
              type="button"
              onClick={() => setSelectedColor(col)}
              aria-label={col}
              aria-pressed={isActive}
              className={`h-6 w-6 rounded-full border-2 p-[2px] transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                isActive ? 'border-accent scale-105' : 'border-transparent hover:border-mist-300'
              }`}
            >
              <span
                className="block h-full w-full rounded-full border border-mist-100"
                style={{ backgroundColor: COLOR_SWATCHES[col] ?? '#ffffff' }}
              />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => toggleFavorite(product)}
        aria-label={t('toggleFavorite')}
        aria-pressed={favorite}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-paper/85 text-ink transition-colors hover:text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={favorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5 8 5 9.7 6.4 12 9c2.3-2.6 4-4 6.4-4C22 5 23.5 8.7 22 11.9 19.5 16.4 12 21 12 21z" />
        </svg>
      </button>
      {product.isNew && (
        <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-paper">
          {t('new')}
        </span>
      )}
    </div>
  );
}
