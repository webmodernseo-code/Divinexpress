'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  CartItem,
  addLine,
  removeLine,
  updateLineQuantity,
  getCartItemCount,
  getCartSubtotalEur
} from '@/lib/cart';

const STORAGE_KEY = 'reign-cart';

export interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalEur: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value: CartContextValue = {
    items,
    addItem: (item) => setItems((prev) => addLine(prev, item)),
    removeItem: (productId, size, color) => setItems((prev) => removeLine(prev, productId, size, color)),
    updateQuantity: (productId, size, color, quantity) =>
      setItems((prev) => updateLineQuantity(prev, productId, size, color, quantity)),
    clearCart: () => setItems([]),
    itemCount: getCartItemCount(items),
    subtotalEur: getCartSubtotalEur(items)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
