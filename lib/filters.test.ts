import { describe, it, expect } from 'vitest';
import {
  parseFilters,
  hasActiveFilters,
  priceRangesForBuckets,
  isFiltersPanelVisible,
  toggleFiltersPanelHref,
  toggleFilterValueHref,
  parseSort,
  sortHref
} from './filters';

describe('parseFilters', () => {
  it('reads repeated taille and couleur params', () => {
    const params = new URLSearchParams('taille=M&taille=L&couleur=Noir');
    expect(parseFilters(params)).toEqual({
      sizes: ['M', 'L'],
      colors: ['Noir'],
      priceBuckets: []
    });
  });

  it('keeps only known price bucket ids', () => {
    const params = new URLSearchParams('prix=50-100&prix=n-importe-quoi');
    expect(parseFilters(params).priceBuckets).toEqual(['50-100']);
  });

  it('returns empty arrays when no filters are present', () => {
    const params = new URLSearchParams('filtres=masques');
    expect(parseFilters(params)).toEqual({ sizes: [], colors: [], priceBuckets: [] });
  });
});

describe('hasActiveFilters', () => {
  it('is false with no filters', () => {
    expect(hasActiveFilters({ sizes: [], colors: [], priceBuckets: [] })).toBe(false);
  });

  it('is true with at least one filter', () => {
    expect(hasActiveFilters({ sizes: ['M'], colors: [], priceBuckets: [] })).toBe(true);
  });
});

describe('priceRangesForBuckets', () => {
  it('maps bucket ids to their cents ranges', () => {
    expect(priceRangesForBuckets(['moins-50'])).toEqual([{ minCents: 0, maxCents: 4999 }]);
  });

  it('the top bucket has no max', () => {
    expect(priceRangesForBuckets(['plus-100'])).toEqual([{ minCents: 10000, maxCents: null }]);
  });

  it('returns one range per requested bucket, in bucket order', () => {
    expect(priceRangesForBuckets(['plus-100', 'moins-50'])).toEqual([
      { minCents: 0, maxCents: 4999 },
      { minCents: 10000, maxCents: null }
    ]);
  });
});

describe('isFiltersPanelVisible', () => {
  it('is true by default', () => {
    expect(isFiltersPanelVisible(new URLSearchParams())).toBe(true);
  });

  it('is false when filtres=masques', () => {
    expect(isFiltersPanelVisible(new URLSearchParams('filtres=masques'))).toBe(false);
  });
});

describe('toggleFiltersPanelHref', () => {
  it('adds filtres=masques when currently visible', () => {
    expect(toggleFiltersPanelHref(new URLSearchParams('taille=M'))).toBe('?taille=M&filtres=masques');
  });

  it('removes filtres when currently hidden', () => {
    expect(toggleFiltersPanelHref(new URLSearchParams('taille=M&filtres=masques'))).toBe('?taille=M');
  });

  it('returns bare ? when there is nothing else in the query', () => {
    expect(toggleFiltersPanelHref(new URLSearchParams())).toBe('?filtres=masques');
  });
});

describe('toggleFilterValueHref', () => {
  it('adds a value that is not yet selected', () => {
    expect(toggleFilterValueHref(new URLSearchParams(), 'taille', 'M')).toBe('?taille=M');
  });

  it('removes a value that is already selected', () => {
    expect(toggleFilterValueHref(new URLSearchParams('taille=M&taille=L'), 'taille', 'M')).toBe('?taille=L');
  });

  it('preserves other filter keys untouched', () => {
    expect(toggleFilterValueHref(new URLSearchParams('couleur=Noir'), 'taille', 'M')).toBe('?couleur=Noir&taille=M');
  });
});

describe('parseSort', () => {
  it('reads a known sort id', () => {
    expect(parseSort(new URLSearchParams('tri=prix-asc'))).toBe('prix-asc');
  });

  it('defaults to nouveautes when missing or unknown', () => {
    expect(parseSort(new URLSearchParams())).toBe('nouveautes');
    expect(parseSort(new URLSearchParams('tri=n-importe-quoi'))).toBe('nouveautes');
  });
});

describe('sortHref', () => {
  it('sets tri for a non-default sort', () => {
    expect(sortHref(new URLSearchParams('taille=M'), 'prix-asc')).toBe('?taille=M&tri=prix-asc');
  });

  it('removes tri when switching back to nouveautes', () => {
    expect(sortHref(new URLSearchParams('taille=M&tri=prix-desc'), 'nouveautes')).toBe('?taille=M');
  });
});
