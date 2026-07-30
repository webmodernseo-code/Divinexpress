'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toggleFavoriteId } from '@/lib/favorites';

const STORAGE_KEY = 'reign-favorites';

export interface FavoritesContextValue {
  favoriteIds: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setFavoriteIds(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const value: FavoritesContextValue = {
    favoriteIds,
    toggleFavorite: (productId) => setFavoriteIds((prev) => toggleFavoriteId(prev, productId)),
    isFavorite: (productId) => favoriteIds.includes(productId)
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
