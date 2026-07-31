'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ShippingFormValues } from '@/lib/checkoutValidation';

const STORAGE_KEY = 'reign-checkout-shipping';

export interface CheckoutContextValue {
  shipping: ShippingFormValues | null;
  setShipping: (values: ShippingFormValues) => void;
  clearShipping: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [shipping, setShippingState] = useState<ShippingFormValues | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setShippingState(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (shipping) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(shipping));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [shipping]);

  return (
    <CheckoutContext.Provider
      value={{ shipping, setShipping: setShippingState, clearShipping: () => setShippingState(null) }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within a CheckoutProvider');
  return ctx;
}
