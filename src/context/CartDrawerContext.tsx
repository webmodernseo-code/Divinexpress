'use client';

import { createContext, useContext, useState } from 'react';

export interface CartDrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CartDrawerContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) throw new Error('useCartDrawer must be used within a CartDrawerProvider');
  return ctx;
}
