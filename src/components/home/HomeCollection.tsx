'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';
import { CATEGORIES, PRODUCTS, getProductsByCategory, type Category } from '@/lib/products';

const CATEGORY_IMAGES: Record<Category, string> = {
  homme: '/image/category_homme.png',
  femme: '/image/category_femme.png',
  enfant: '/image/category_enfant.png',
  accessoires: '/image/category_accessoires.png'
};
import {
  filterAndSortProducts,
  getAvailableColors,
  getAvailableSizes,
  getAvailableSubcategories,
  interleaveByCategory,
  type SortOption
} from '@/lib/productFilters';

/** Deterministic mixed order, so the unfiltered grid never looks sorted by category. */
/** 2 rows of 4 on desktop, 3 rows of 2 on mobile, before "load more". */
const DESKTOP_PAGE_SIZE = 8;
const MOBILE_PAGE_SIZE = 6;

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-3.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-mist-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer appearance-none rounded-full border border-mist-100 bg-paper py-2.5 pl-4 pr-9 text-[13px] font-semibold text-ink transition-colors hover:border-accent focus:border-accent focus:outline-none md:w-auto"
      >
        {children}
      </select>
      <ChevronIcon />
    </div>
  );
}

export function HomeCollection({
  initialCategory,
  initialSubcategory,
  products: catalogProducts = PRODUCTS,
}: {
  initialCategory: Category | null;
  initialSubcategory: string | null;
  products?: typeof PRODUCTS;
}) {
  const t = useTranslations('home');
  const tNav = useTranslations('nav');
  const tFilters = useTranslations('category');

  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSubcategory ?? '');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [sort, setSort] = useState<SortOption>('default');
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryProducts = useMemo(
    () => (category ? catalogProducts.filter((product) => product.category === category) : []),
    [category, catalogProducts]
  );

  const mixedProducts = useMemo(() => interleaveByCategory(catalogProducts), [catalogProducts]);

  const products = useMemo(
    () =>
      category
        ? filterAndSortProducts(catalogProducts, { category, subcategory, size, color, sort })
        : mixedProducts,
    [category, subcategory, size, color, sort, catalogProducts, mixedProducts]
  );

  function selectCategory(next: Category) {
    setCategory((current) => (current === next ? null : next));
    setSubcategory('');
    setSize('');
    setColor('');
    setSort('default');
    setIsExpanded(false);
  }

  const visibleProducts = isExpanded ? products : products.slice(0, DESKTOP_PAGE_SIZE);
  const hasMoreOnMobile = !isExpanded && products.length > MOBILE_PAGE_SIZE;
  const hasMoreOnDesktop = !isExpanded && products.length > DESKTOP_PAGE_SIZE;

  return (
    <>
      <Container className="pt-14 md:pt-18">
        <Heading level={2}>{t('categoriesTitle')}</Heading>
        <div className="mt-7 flex flex-wrap justify-center gap-4 md:mt-10 md:gap-9">
          {CATEGORIES.map((item) => {
            const isActive = category === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => selectCategory(item)}
                aria-pressed={isActive}
                className="group flex flex-col items-center"
              >
                <div className={`relative aspect-square w-16 overflow-hidden rounded-full transition-transform duration-200 group-hover:scale-105 md:w-[116px] ${
                  isActive ? 'ring-[3px] ring-accent' : ''
                }`}>
                  <Image
                    src={CATEGORY_IMAGES[item]}
                    alt={tNav(item)}
                    fill
                    sizes="(max-width: 768px) 64px, 116px"
                    className="object-cover"
                    priority
                  />
                </div>
                <p
                  className={`mt-2 text-center text-[11px] font-bold tracking-wide transition-colors md:mt-3 md:text-[13px] ${
                    isActive ? 'text-accent' : 'text-ink'
                  }`}
                >
                  {tNav(item)}
                </p>
              </button>
            );
          })}
        </div>
      </Container>

      <Container className="pb-14 pt-12 md:pb-18 md:pt-16">
        <Heading level={2}>{t('collectionTitle')}</Heading>

        {category && (
          <div className="mt-6 flex flex-col gap-2.5 md:mt-7 md:flex-row md:flex-wrap md:justify-center">
            <FilterSelect
              label={tFilters('filterSubcategory')}
              value={subcategory}
              onChange={(value) => {
                setSubcategory(value);
                setIsExpanded(false);
              }}
            >
              <option value="">{tFilters('allSubcategories')}</option>
              {getAvailableSubcategories(categoryProducts).map((item) => (
                <option key={item} value={item} className="capitalize">
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label={tFilters('filterSize')}
              value={size}
              onChange={(value) => {
                setSize(value);
                setIsExpanded(false);
              }}
            >
              <option value="">{tFilters('allSizes')}</option>
              {getAvailableSizes(categoryProducts).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label={tFilters('filterColor')}
              value={color}
              onChange={(value) => {
                setColor(value);
                setIsExpanded(false);
              }}
            >
              <option value="">{tFilters('allColors')}</option>
              {getAvailableColors(categoryProducts).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label={tFilters('sortBy')}
              value={sort}
              onChange={(value) => {
                setSort(value as SortOption);
                setIsExpanded(false);
              }}
            >
              <option value="default">{tFilters('sortDefault')}</option>
              <option value="price-asc">{tFilters('sortPriceAsc')}</option>
              <option value="price-desc">{tFilters('sortPriceDesc')}</option>
              <option value="newest">{tFilters('sortNewest')}</option>
            </FilterSelect>
          </div>
        )}

        {products.length === 0 ? (
          <p className="mt-12 text-center text-sm text-mist-500">{tFilters('empty')}</p>
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
    </>
  );
}
