import { describe, expect, it } from 'vitest';
import {
  filterAndSortProducts,
  getAvailableSubcategories,
  getAvailableSizes,
  getAvailableColors,
  interleaveByCategory
} from './productFilters';
import { PRODUCTS, getProductsByCategory } from './products';

const homme = getProductsByCategory('homme');

describe('filterAndSortProducts', () => {
  it('returns all products when no filters are given', () => {
    expect(filterAndSortProducts(homme, {})).toHaveLength(homme.length);
  });

  it('keeps the input order by default', () => {
    expect(filterAndSortProducts(homme, {}).map((p) => p.id)).toEqual(homme.map((p) => p.id));
  });

  it('filters by category', () => {
    const result = filterAndSortProducts(PRODUCTS, { category: 'femme' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.category === 'femme')).toBe(true);
  });

  it('filters by subcategory', () => {
    const result = filterAndSortProducts(homme, { subcategory: 'vestes' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.subcategory === 'vestes')).toBe(true);
  });

  it('filters by size', () => {
    const result = filterAndSortProducts(homme, { size: 'XS' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.sizes.includes('XS'))).toBe(true);
  });

  it('filters by color', () => {
    const result = filterAndSortProducts(homme, { color: 'Noir' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.colors.includes('Noir'))).toBe(true);
  });

  it('returns an empty array when no product matches', () => {
    expect(filterAndSortProducts(homme, { size: '42A' })).toEqual([]);
  });

  it('sorts by ascending price', () => {
    const result = filterAndSortProducts(homme, { sort: 'price-asc' });
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i].priceEur).toBeGreaterThanOrEqual(result[i - 1].priceEur);
    }
  });

  it('sorts by descending price', () => {
    const result = filterAndSortProducts(homme, { sort: 'price-desc' });
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i].priceEur).toBeLessThanOrEqual(result[i - 1].priceEur);
    }
  });

  it('puts new products first when sorting by newest', () => {
    const result = filterAndSortProducts(PRODUCTS, { sort: 'newest' });
    const newCount = PRODUCTS.filter((p) => p.isNew).length;
    expect(newCount).toBeGreaterThan(0);
    expect(result.slice(0, newCount).every((p) => p.isNew)).toBe(true);
    expect(result.slice(newCount).every((p) => !p.isNew)).toBe(true);
  });

  it('combines a category, a subcategory filter and a sort', () => {
    const result = filterAndSortProducts(PRODUCTS, {
      category: 'homme',
      subcategory: 't-shirts',
      sort: 'price-asc'
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.category === 'homme' && p.subcategory === 't-shirts')).toBe(true);
  });

  it('ignores null and undefined filter values', () => {
    const result = filterAndSortProducts(homme, {
      category: null,
      subcategory: null,
      size: undefined,
      color: null,
      sort: 'default'
    });
    expect(result).toHaveLength(homme.length);
  });

  it('does not mutate the products it is given', () => {
    const input = [...homme];
    filterAndSortProducts(input, { sort: 'price-desc' });
    expect(input).toEqual(homme);
  });
});

describe('getAvailableSubcategories/Sizes/Colors', () => {
  it('returns unique subcategories present in the given products', () => {
    const subcats = getAvailableSubcategories(homme);
    expect(subcats.length).toBeGreaterThan(0);
    expect(new Set(subcats).size).toBe(subcats.length);
    expect(subcats).toContain('vestes');
  });

  it('returns unique sizes present in the given products', () => {
    const sizes = getAvailableSizes(homme);
    expect(sizes.length).toBeGreaterThan(0);
    expect(new Set(sizes).size).toBe(sizes.length);
    expect(sizes).toContain('XL');
  });

  it('returns unique colors present in the given products', () => {
    const colors = getAvailableColors(homme);
    expect(colors.length).toBeGreaterThan(0);
    expect(new Set(colors).size).toBe(colors.length);
    expect(colors).toContain('Noir');
  });

  it('only reports values from the products it is given', () => {
    const enfant = getProductsByCategory('enfant');
    expect(getAvailableSizes(enfant)).not.toContain('XL');
  });
});

describe('interleaveByCategory', () => {
  it('keeps every product exactly once', () => {
    const result = interleaveByCategory(PRODUCTS);
    expect(result).toHaveLength(PRODUCTS.length);
    expect(new Set(result.map((p) => p.id))).toEqual(new Set(PRODUCTS.map((p) => p.id)));
  });

  it('does not leave products grouped by category', () => {
    const result = interleaveByCategory(PRODUCTS);
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i].category).not.toBe(result[i - 1].category);
    }
  });

  it('is deterministic', () => {
    expect(interleaveByCategory(PRODUCTS).map((p) => p.id)).toEqual(
      interleaveByCategory(PRODUCTS).map((p) => p.id)
    );
  });

  it('handles an empty list', () => {
    expect(interleaveByCategory([])).toEqual([]);
  });
});
