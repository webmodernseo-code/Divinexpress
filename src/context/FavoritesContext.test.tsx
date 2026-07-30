import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

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
      result.current.toggleFavorite('p1');
    });
    expect(result.current.isFavorite('p1')).toBe(true);
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('reign-favorites') ?? '[]');
      expect(stored).toEqual(['p1']);
    });
  });

  it('toggles a product back out', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => {
      result.current.toggleFavorite('p1');
    });
    act(() => {
      result.current.toggleFavorite('p1');
    });
    expect(result.current.isFavorite('p1')).toBe(false);
  });

  it('does not clobber existing localStorage data during the initial hydration effects', () => {
    window.localStorage.setItem('reign-favorites', JSON.stringify(['p1']));
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderHook(() => useFavorites(), { wrapper });
    const clobberedWithEmpty = setItemSpy.mock.calls.some(
      ([key, value]) => key === 'reign-favorites' && value === '[]'
    );
    expect(clobberedWithEmpty).toBe(false);
    setItemSpy.mockRestore();
  });
});
