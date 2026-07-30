import { describe, expect, it } from 'vitest';
import {
  getProductsByCategory,
  getProductBySlug,
  getProductById,
  searchProducts,
  getRelatedProducts,
  PRODUCTS
} from './products';

describe('getProductsByCategory', () => {
  it('returns only products in the requested category', () => {
    const results = getProductsByCategory('femme');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.category === 'femme')).toBe(true);
  });
});

describe('getProductBySlug', () => {
  it('finds a known product by its slug', () => {
    const product = getProductBySlug(PRODUCTS[0].slug);
    expect(product?.id).toBe(PRODUCTS[0].id);
  });

  it('returns undefined for an unknown slug', () => {
    expect(getProductBySlug('does-not-exist')).toBeUndefined();
  });
});

describe('getProductById', () => {
  it('finds a known product by its id', () => {
    const product = getProductById(PRODUCTS[0].id);
    expect(product?.slug).toBe(PRODUCTS[0].slug);
  });
});

describe('searchProducts', () => {
  it('matches on the French name', () => {
    const target = PRODUCTS[0];
    const results = searchProducts(target.name.fr.slice(0, 4), 'fr');
    expect(results.some((p) => p.id === target.id)).toBe(true);
  });

  it('matches on the English name', () => {
    const target = PRODUCTS[0];
    const results = searchProducts(target.name.en.slice(0, 4), 'en');
    expect(results.some((p) => p.id === target.id)).toBe(true);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchProducts('zzzznomatch', 'fr')).toEqual([]);
  });
});

describe('getRelatedProducts', () => {
  it('returns products referenced by relatedProductIds', () => {
    const withRelated = PRODUCTS.find((p) => (p.relatedProductIds?.length ?? 0) > 0)!;
    const related = getRelatedProducts(withRelated);
    expect(related.length).toBe(withRelated.relatedProductIds!.length);
    expect(related.every((p) => p.id !== withRelated.id)).toBe(true);
  });
});
