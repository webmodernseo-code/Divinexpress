'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  variantId: string;
  size: string;
  color: string;
  quantity: number;
  title: string;
  price: number;
  image: string;
}

interface StoreContextProps {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty: number) => void;
  removeFromCart: (variantId: string) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const StoreContext = createContext<StoreContextProps | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('DivinExpress_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    const savedFavs = localStorage.getItem('DivinExpress_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty: number) => {
    setCart((prev) => {
      const next = [...prev];
      const idx = next.findIndex((i) => i.variantId === item.variantId);
      if (idx !== -1) {
        next[idx].quantity += qty;
      } else {
        next.push({ ...item, quantity: qty });
      }
      localStorage.setItem('DivinExpress_cart', JSON.stringify(next));
      return next;
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.variantId !== variantId);
      localStorage.setItem('DivinExpress_cart', JSON.stringify(next));
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id];
      localStorage.setItem('DivinExpress_favorites', JSON.stringify(next));
      return next;
    });
  };

  return (
    <StoreContext.Provider value={{ cart, addToCart, removeFromCart, favorites, toggleFavorite }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
