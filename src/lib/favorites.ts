import type { Product } from './products';

export function toggleFavoriteId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

function isFavoriteSnapshot(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const product = value as Partial<Product>;
  return typeof product.id === 'string' && typeof product.slug === 'string'
    && typeof product.category === 'string' && typeof product.subcategory === 'string'
    && typeof product.name?.fr === 'string' && typeof product.name?.en === 'string'
    && typeof product.description?.fr === 'string' && typeof product.description?.en === 'string'
    && typeof product.priceEur === 'number' && Number.isFinite(product.priceEur)
    && Array.isArray(product.sizes) && Array.isArray(product.colors)
    && typeof product.imageCount === 'number';
}

export function parseStoredFavorites(raw: string): Product[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isFavoriteSnapshot) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteProduct(products: Product[], product: Product): Product[] {
  return products.some((current) => current.id === product.id)
    ? products.filter((current) => current.id !== product.id)
    : [...products, product];
}
