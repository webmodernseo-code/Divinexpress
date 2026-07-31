import type { Category, Product } from './products';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest';

export interface ProductFilterParams {
  category?: Category | null;
  subcategory?: string | null;
  size?: string | null;
  color?: string | null;
  sort?: SortOption | null;
}

export function filterAndSortProducts(products: Product[], params: ProductFilterParams): Product[] {
  let result = products;

  if (params.category) {
    result = result.filter((p) => p.category === params.category);
  }
  if (params.subcategory) {
    result = result.filter((p) => p.subcategory === params.subcategory);
  }
  if (params.size) {
    result = result.filter((p) => p.sizes.includes(params.size as string));
  }
  if (params.color) {
    result = result.filter((p) => p.colors.includes(params.color as string));
  }

  const sorted = [...result];
  if (params.sort === 'price-asc') {
    sorted.sort((a, b) => a.priceEur - b.priceEur);
  } else if (params.sort === 'price-desc') {
    sorted.sort((a, b) => b.priceEur - a.priceEur);
  } else if (params.sort === 'newest') {
    sorted.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
  }

  return sorted;
}

export function getAvailableSubcategories(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.subcategory)));
}

export function getAvailableSizes(products: Product[]): string[] {
  return Array.from(new Set(products.flatMap((p) => p.sizes)));
}

export function getAvailableColors(products: Product[]): string[] {
  return Array.from(new Set(products.flatMap((p) => p.colors)));
}

/**
 * Deterministic round-robin over categories, so an unfiltered grid does not
 * look like it was sorted by category. No randomness: server and client render
 * the exact same order.
 */
export function interleaveByCategory(products: Product[]): Product[] {
  const buckets = new Map<Category, Product[]>();
  for (const product of products) {
    const bucket = buckets.get(product.category);
    if (bucket) {
      bucket.push(product);
    } else {
      buckets.set(product.category, [product]);
    }
  }

  const queues = Array.from(buckets.values());
  const longest = queues.reduce((max, queue) => Math.max(max, queue.length), 0);
  const result: Product[] = [];
  for (let index = 0; index < longest; index += 1) {
    for (const queue of queues) {
      if (index < queue.length) result.push(queue[index]);
    }
  }
  return result;
}
