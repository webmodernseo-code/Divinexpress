import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

const product = {
  id: 'p1', slug: 'product-1', category: 'homme' as const, subcategory: '',
  name: { fr: 'Produit', en: 'Product' }, description: { fr: '', en: '' },
  priceEur: 90, sizes: ['M'], colors: ['Noir'], imageCount: 1,
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

describe('FavoritesContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.isFavorite('p1')).toBe(false);
  });

  it('toggles a product in and persists it to localStorage', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => {
      result.current.toggleFavorite(product);
    });
    expect(result.current.isFavorite('p1')).toBe(true);
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('divinexpress-favorites-v2') ?? '[]');
      expect(stored).toEqual([product]);
    });
  });

  it('toggles a product back out', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => {
      result.current.toggleFavorite(product);
    });
    act(() => {
      result.current.toggleFavorite(product);
    });
    expect(result.current.isFavorite('p1')).toBe(false);
  });

  it('does not clobber existing localStorage data during the initial hydration effects', () => {
    window.localStorage.setItem('divinexpress-favorites-v2', JSON.stringify([product]));
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderHook(() => useFavorites(), { wrapper });
    const clobberedWithEmpty = setItemSpy.mock.calls.some(
      ([key, value]) => key === 'divinexpress-favorites-v2' && value === '[]'
    );
    expect(clobberedWithEmpty).toBe(false);
    setItemSpy.mockRestore();
  });
});
