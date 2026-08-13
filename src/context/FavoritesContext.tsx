'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Product } from '@/lib/products';
import { parseStoredFavorites, toggleFavoriteProduct } from '@/lib/favorites';

const STORAGE_KEY = 'divinexpress-favorites-v2';

export interface FavoritesContextValue {
  favoriteIds: string[];
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(parseStoredFavorites(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const favoriteIds = favorites.map((product) => product.id);

  const value: FavoritesContextValue = {
    favoriteIds,
    favorites,
    toggleFavorite: (product) => setFavorites((current) => toggleFavoriteProduct(current, product)),
    isFavorite: (productId) => favoriteIds.includes(productId)
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
