'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CurrencyCode, defaultCurrencyForLocale } from '@/lib/currency';

const STORAGE_KEY = 'divinexpress-currency';

export interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  children,
  initialLocale,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialLocale: string;
  initialCurrency?: CurrencyCode;
}) {
  const [currency, setCurrency] = useState<CurrencyCode>(() => initialCurrency ?? defaultCurrencyForLocale(initialLocale));
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'EUR' || stored === 'GBP') {
        setCurrency(stored);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
