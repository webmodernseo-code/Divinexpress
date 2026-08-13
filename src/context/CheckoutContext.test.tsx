import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CheckoutProvider, useCheckout } from './CheckoutContext';
import type { ShippingFormValues } from '@/lib/checkoutValidation';

const STORAGE_KEY = 'divinexpress-checkout-shipping';

const sampleShipping: ShippingFormValues = {
  region: 'europe',
  fullName: 'Alex Martin',
  email: 'alex@example.com',
  address: '12 rue de la Paix',
  city: 'Paris',
  postalCode: '75002',
  country: 'France',
  countryCode: 'FR'
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <CheckoutProvider>{children}</CheckoutProvider>;
}

describe('CheckoutContext', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useCheckout())).toThrow();
  });

  it('starts with shipping: null when sessionStorage has no prior data', () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });
    expect(result.current.shipping).toBeNull();
  });

  it('updates shipping and persists it to sessionStorage on setShipping', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });
    act(() => {
      result.current.setShipping(sampleShipping);
    });
    expect(result.current.shipping).toEqual(sampleShipping);
    await waitFor(() => {
      expect(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(sampleShipping);
    });
  });

  it('clears shipping and removes the sessionStorage key on clearShipping', async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });
    act(() => {
      result.current.setShipping(sampleShipping);
    });
    await waitFor(() => {
      expect(window.sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });

    act(() => {
      result.current.clearShipping();
    });
    expect(result.current.shipping).toBeNull();
    await waitFor(() => {
      expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  it('hydrates shipping from pre-existing sessionStorage data on mount', async () => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sampleShipping));
    const { result } = renderHook(() => useCheckout(), { wrapper });
    // The bootstrap read happens in an effect after the initial render, so the very
    // first render still reflects `shipping: null` until that effect flushes. This is
    // exactly the timing gap `ShippingPage` had to defensively re-sync against.
    await waitFor(() => {
      expect(result.current.shipping).toEqual(sampleShipping);
    });
  });
});
