import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CurrencyProvider, useCurrency } from './CurrencyContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CurrencyProvider initialLocale="fr">{children}</CurrencyProvider>;
}

describe('CurrencyContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to EUR for the fr locale', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.currency).toBe('EUR');
  });

  it('updates the currency and persists it to localStorage', async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    act(() => {
      result.current.setCurrency('GBP');
    });
    expect(result.current.currency).toBe('GBP');
    await waitFor(() => {
      expect(window.localStorage.getItem('reign-currency')).toBe('GBP');
    });
  });

  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useCurrency())).toThrow();
  });
});
