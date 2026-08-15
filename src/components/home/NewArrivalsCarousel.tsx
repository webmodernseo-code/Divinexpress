'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getProductImageUrl, type Product } from '@/lib/products';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/currency';

const AUTOPLAY_MS = 4000;

export function NewArrivalsCarousel({
  title,
  subtitle,
  products
}: {
  title: string;
  subtitle: string;
  products: Product[];
}) {
  const locale = useLocale() as 'fr' | 'en';
  const t = useTranslations('product');
  const { currency } = useCurrency();

  const [currentIndex, setCurrentIndex] = useState(Math.floor(products.length / 2));
  const [isHovered, setIsHovered] = useState(false);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  }, [products.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  }, [products.length]);

  useEffect(() => {
    if (isHovered || products.length <= 1) return;
    const interval = setInterval(handleNext, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [isHovered, products.length, handleNext]);

  if (products.length === 0) return null;

  const activeProduct = products[currentIndex];

  return (
    <section className="w-full bg-ink py-14 text-paper md:py-20">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="font-serif text-3xl md:text-4xl">{title}</h2>
        <p className="mt-4 text-sm text-paper/70 md:text-base">{subtitle}</p>
      </div>

      <div
        className="relative mx-auto mt-10 flex h-[300px] w-full max-w-6xl items-center justify-center sm:h-[380px] md:mt-14 md:h-[460px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative flex h-full w-full items-center justify-center [perspective:1000px]">
          {products.map((product, index) => {
            const total = products.length;
            let pos = (index - currentIndex + total) % total;
            if (pos > Math.floor(total / 2)) pos -= total;

            const isActive = pos === 0;
            const isAdjacent = Math.abs(pos) === 1;
            const imageUrl = product.images?.[0] ?? getProductImageUrl(product, product.colors[0]);

            return (
              <Link
                key={product.id}
                href={`/produit/${product.slug}`}
                aria-label={product.name[locale]}
                aria-hidden={!isActive}
                tabIndex={isActive ? 0 : -1}
                className="absolute h-56 w-36 transition-all duration-500 ease-in-out sm:h-72 sm:w-48 md:h-[420px] md:w-64 lg:h-[460px] lg:w-72"
                style={{
                  transform: `translateX(${pos * 45}%) scale(${isActive ? 1 : isAdjacent ? 0.85 : 0.7}) rotateY(${pos * -10}deg)`,
                  zIndex: isActive ? 10 : isAdjacent ? 5 : 1,
                  opacity: isActive ? 1 : isAdjacent ? 0.4 : 0,
                  filter: isActive ? 'blur(0px)' : 'blur(4px)',
                  visibility: Math.abs(pos) > 1 ? 'hidden' : 'visible',
                  pointerEvents: isActive ? 'auto' : 'none'
                }}
              >
                <img
                  src={imageUrl}
                  alt={product.name[locale]}
                  className="h-full w-full rounded-3xl border-2 border-paper/10 object-cover shadow-2xl"
                />
                {isActive && (
                  <span className="absolute left-3 top-3 rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
                    {t('new')}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {products.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Précédent"
              className="absolute left-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-paper/30 bg-black/10 text-paper backdrop-blur-xs transition-colors hover:border-paper hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper sm:left-4 sm:size-12"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Suivant"
              className="absolute right-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-paper/30 bg-black/10 text-paper backdrop-blur-xs transition-colors hover:border-paper hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper sm:right-4 sm:size-12"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <div className="mx-auto mt-6 max-w-md px-4 text-center md:mt-8">
        <p className="text-sm font-semibold sm:text-base">{activeProduct.name[locale]}</p>
        <p className="mt-1 text-sm text-paper/70">{formatPrice(activeProduct.priceEur, currency, locale)}</p>
      </div>

      {products.length > 1 && (
        <div className="mt-5 flex justify-center gap-3">
          {products.map((product, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive ? 'w-8 bg-paper' : 'w-2 bg-paper/40 hover:bg-paper/70'
                }`}
                aria-label={`Voir ${product.name[locale]}`}
                aria-pressed={isActive}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
