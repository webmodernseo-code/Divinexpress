import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import { PRODUCTS } from '@/lib/products';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe('CartContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
  });

  it('adds an item and persists it to localStorage', async () => {
    const product = PRODUCTS[0];
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ productId: product.id, size: 'M', color: 'Noir', quantity: 1 });
    });
    expect(result.current.itemCount).toBe(1);
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('reign-cart') ?? '[]');
      expect(stored).toHaveLength(1);
    });
  });

  it('computes the subtotal from catalog prices', () => {
    const product = PRODUCTS[0];
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ productId: product.id, size: 'M', color: 'Noir', quantity: 2 });
    });
    expect(result.current.subtotalEur).toBe(product.priceEur * 2);
  });
});
