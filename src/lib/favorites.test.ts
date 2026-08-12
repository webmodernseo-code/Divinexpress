import { describe, expect, it } from 'vitest';
import { parseStoredFavorites, toggleFavoriteId } from './favorites';

describe('toggleFavoriteId', () => {
  it('adds an id that is not yet present', () => {
    expect(toggleFavoriteId([], 'p1')).toEqual(['p1']);
  });

  it('removes an id that is already present', () => {
    expect(toggleFavoriteId(['p1', 'p2'], 'p1')).toEqual(['p2']);
  });
});

describe('parseStoredFavorites', () => {
  it('restores complete product snapshots and rejects legacy ids', () => {
    const product = {
      id: 'p1', slug: 'persisted-product', category: 'homme', subcategory: '',
      name: { fr: 'Produit', en: 'Product' }, description: { fr: '', en: '' },
      priceEur: 90, sizes: ['M'], colors: ['Noir'], imageCount: 1,
    };
    expect(parseStoredFavorites(JSON.stringify([product]))).toEqual([product]);
    expect(parseStoredFavorites(JSON.stringify(['p1']))).toEqual([]);
  });
});
