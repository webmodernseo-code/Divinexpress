export type PriceBucketId = 'moins-50' | '50-100' | 'plus-100';

export const PRICE_BUCKETS: {
  id: PriceBucketId;
  labelFr: string;
  labelEn: string;
  minCents: number;
  maxCents: number | null;
}[] = [
  { id: 'moins-50', labelFr: 'Moins de 50€', labelEn: 'Under £50', minCents: 0, maxCents: 4999 },
  { id: '50-100', labelFr: '50-100€', labelEn: '£50-£100', minCents: 5000, maxCents: 9999 },
  { id: 'plus-100', labelFr: 'Plus de 100€', labelEn: 'Over £100', minCents: 10000, maxCents: null }
];

export type ProductFilters = {
  sizes: string[];
  colors: string[];
  priceBuckets: PriceBucketId[];
};

function isPriceBucketId(value: string): value is PriceBucketId {
  return PRICE_BUCKETS.some((bucket) => bucket.id === value);
}

export function parseFilters(searchParams: URLSearchParams): ProductFilters {
  return {
    sizes: searchParams.getAll('taille'),
    colors: searchParams.getAll('couleur'),
    priceBuckets: searchParams.getAll('prix').filter(isPriceBucketId)
  };
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return filters.sizes.length > 0 || filters.colors.length > 0 || filters.priceBuckets.length > 0;
}

export function priceRangesForBuckets(
  bucketIds: PriceBucketId[]
): { minCents: number; maxCents: number | null }[] {
  const idSet = new Set(bucketIds);
  return PRICE_BUCKETS.filter((b) => idSet.has(b.id)).map((bucket) => ({
    minCents: bucket.minCents,
    maxCents: bucket.maxCents
  }));
}

export function isFiltersPanelVisible(searchParams: URLSearchParams): boolean {
  return searchParams.get('filtres') !== 'masques';
}

export function toggleFiltersPanelHref(searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams);
  if (isFiltersPanelVisible(searchParams)) {
    next.set('filtres', 'masques');
  } else {
    next.delete('filtres');
  }
  const query = next.toString();
  return `?${query}`;
}

export function toggleFilterValueHref(
  searchParams: URLSearchParams,
  key: 'taille' | 'couleur' | 'prix',
  value: string
): string {
  const next = new URLSearchParams(searchParams);
  const current = next.getAll(key);
  next.delete(key);
  const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  updated.forEach((v) => next.append(key, v));
  const query = next.toString();
  return `?${query}`;
}

export type SortId = 'nouveautes' | 'prix-asc' | 'prix-desc';

export const SORT_OPTIONS: { id: SortId; labelFr: string; labelEn: string }[] = [
  { id: 'nouveautes', labelFr: 'Nouveautés', labelEn: 'Newest' },
  { id: 'prix-asc', labelFr: 'Prix croissant', labelEn: 'Price: low to high' },
  { id: 'prix-desc', labelFr: 'Prix décroissant', labelEn: 'Price: high to low' }
];

function isSortId(value: string): value is SortId {
  return SORT_OPTIONS.some((option) => option.id === value);
}

export function parseSort(searchParams: URLSearchParams): SortId {
  const value = searchParams.get('tri');
  return value !== null && isSortId(value) ? value : 'nouveautes';
}

export function sortHref(searchParams: URLSearchParams, sortId: SortId): string {
  const next = new URLSearchParams(searchParams);
  if (sortId === 'nouveautes') {
    next.delete('tri');
  } else {
    next.set('tri', sortId);
  }
  const query = next.toString();
  return `?${query}`;
}

export function matchVariant(
  variant: { size: string; color: string; priceCents: number },
  filters: ProductFilters
): boolean {
  if (filters.sizes.length > 0 && !filters.sizes.includes(variant.size)) {
    return false;
  }
  if (filters.colors.length > 0 && !filters.colors.includes(variant.color)) {
    return false;
  }
  if (filters.priceBuckets.length > 0) {
    const ranges = priceRangesForBuckets(filters.priceBuckets);
    const matchesPrice = ranges.some(({ minCents, maxCents }) =>
      maxCents === null
        ? variant.priceCents >= minCents
        : variant.priceCents >= minCents && variant.priceCents <= maxCents
    );
    if (!matchesPrice) {
      return false;
    }
  }
  return true;
}
