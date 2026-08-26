'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';
import { CATEGORIES, type Category, type Product } from '@/lib/products';

const CATEGORY_IMAGES: Record<Category, string> = {
  homme: '/image/categories/icon-homme.png',
  femme: '/image/categories/icon-femme.png',
  enfant: '/image/categories/icon-enfant.png',
  accessoires: '/image/categories/icon-accessoirs.png'
};
import { interleaveByCategory } from '@/lib/productFilters';

type CategoryChoice = Category | 'all';
const CATEGORY_CHOICES: CategoryChoice[] = ['all', ...CATEGORIES];

/** Deterministic mixed order, so the unfiltered grid never looks sorted by category. */
/** 2 rows of 4 on desktop, 3 rows of 2 on mobile, before "load more". */
const DESKTOP_PAGE_SIZE = 8;
const MOBILE_PAGE_SIZE = 6;

export function HomeCollection({
  initialCategory,
  products: catalogProducts,
}: {
  initialCategory: Category | null;
  initialSubcategory: string | null;
  products: Product[];
}) {
  const t = useTranslations('home');
  const tNav = useTranslations('nav');

  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [isExpanded, setIsExpanded] = useState(false);

  const mixedProducts = useMemo(() => interleaveByCategory(catalogProducts), [catalogProducts]);

  const products = useMemo(
    () => (category ? catalogProducts.filter((product) => product.category === category) : mixedProducts),
    [category, catalogProducts, mixedProducts]
  );

  function selectCategory(next: CategoryChoice) {
    setCategory(next === 'all' ? null : next);
    setIsExpanded(false);
  }

  const visibleProducts = isExpanded ? products : products.slice(0, DESKTOP_PAGE_SIZE);
  const hasMoreOnMobile = !isExpanded && products.length > MOBILE_PAGE_SIZE;
  const hasMoreOnDesktop = !isExpanded && products.length > DESKTOP_PAGE_SIZE;

  return (
    <>
      <Container className="pt-14 md:pt-18">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {CATEGORY_CHOICES.map((item) => {
            const isActive = item === 'all' ? category === null : category === item;
            const label = item === 'all' ? tNav('allCategories') : tNav(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => selectCategory(item)}
                aria-pressed={isActive}
                className="group flex flex-col items-center rounded-2xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className={`relative aspect-square w-16 overflow-hidden rounded-full transition-transform duration-200 group-hover:scale-105 md:w-[116px] ${
                  isActive ? 'ring-[3px] ring-accent ring-offset-4' : ''
                }`}>
                  <Image
                    src={item === 'all' ? '/branding/logo-divinexpress-mark.png' : CATEGORY_IMAGES[item]}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 64px, 116px"
                    className={item === 'all' ? 'bg-mist-100 object-contain p-3' : 'object-cover'}
                    priority
                  />
                </div>
                <p
                  className={`mt-2 text-center text-[11px] font-bold tracking-wide transition-colors md:mt-3 md:text-[13px] ${
                    isActive ? 'text-accent' : 'text-ink'
                  }`}
                >
                  {label}
                </p>
              </button>
            );
          })}
        </div>
      </Container>

      <section id="collection" className="scroll-mt-32">
        <Container className="pb-14 pt-12 md:pb-18 md:pt-16">
          <Heading level={2}>{t('collectionTitle')}</Heading>

          {products.length === 0 ? (
            <p className="mt-12 text-center text-sm text-mist-500">
              Aucun produit n’est disponible dans cette catégorie pour le moment — revenez très bientôt.
            </p>
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-5 md:mt-10 md:grid-cols-4 md:gap-7">
              {visibleProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={!isExpanded && index >= MOBILE_PAGE_SIZE ? 'hidden md:block' : undefined}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {hasMoreOnMobile && (
            <div className={`mt-10 flex justify-center ${hasMoreOnDesktop ? '' : 'md:hidden'}`}>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="rounded-full border border-ink px-8 py-3.5 text-[13px] font-bold tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                {t('loadMore')}
              </button>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
