import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartDrawerProvider, useCartDrawer } from './CartDrawerContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartDrawerProvider>{children}</CartDrawerProvider>;
}

describe('CartDrawerContext', () => {
  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useCartDrawer())).toThrow();
  });

  it('starts closed', () => {
    const { result } = renderHook(() => useCartDrawer(), { wrapper });
    expect(result.current.isOpen).toBe(false);
  });

  it('opens the drawer when open() is called', () => {
    const { result } = renderHook(() => useCartDrawer(), { wrapper });
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('closes the drawer when close() is called after being opened', () => {
    const { result } = renderHook(() => useCartDrawer(), { wrapper });
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });
});
