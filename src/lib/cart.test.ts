// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  addLine,
  removeLine,
  updateLineQuantity,
  getCartItemCount,
  getCartSubtotalEur,
  parseStoredCart,
  CartItem
} from './cart';
import { PRODUCTS } from './products';

const productA = PRODUCTS[0];
const productB = PRODUCTS[1];

describe('parseStoredCart', () => {
  it('keeps a complete persisted product snapshot without consulting a static catalog', () => {
    const snapshot = {
      productId: 'persisted-shirt', slug: 'persisted-shirt',
      name: { fr: 'Chemise persistée', en: 'Persisted shirt' },
      imageUrl: '/image/category_homme.png', category: 'homme',
      size: 'M', color: 'Noir', quantity: 2, unitPriceEur: 89,
    };
    expect(parseStoredCart(JSON.stringify([snapshot]))).toEqual([snapshot]);
  });

  it('discards obsolete or malformed browser cart records', () => {
    expect(parseStoredCart(JSON.stringify([{ productId: 'legacy', quantity: 1 }]))).toEqual([]);
    expect(parseStoredCart('{broken')).toEqual([]);
  });
});

describe('addLine', () => {
  it('adds a new line for a product/size/color not already in the cart', () => {
    const items: CartItem[] = [];
    const result = addLine(items, { productId: productA.id, size: 'M', color: 'Noir', quantity: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
  });

  it('merges quantity when the same product/size/color is added again', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 1 }];
    const result = addLine(items, { productId: productA.id, size: 'M', color: 'Noir', quantity: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
  });

  it('keeps separate lines for the same product in a different size', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 1 }];
    const result = addLine(items, { productId: productA.id, size: 'L', color: 'Noir', quantity: 1 });
    expect(result).toHaveLength(2);
  });
});

describe('removeLine', () => {
  it('removes the matching line only', () => {
    const items: CartItem[] = [
      { productId: productA.id, size: 'M', color: 'Noir', quantity: 1 },
      { productId: productB.id, size: 'S', color: 'Blanc', quantity: 1 }
    ];
    const result = removeLine(items, productA.id, 'M', 'Noir');
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe(productB.id);
  });
});

describe('updateLineQuantity', () => {
  it('updates the quantity of the matching line', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 1 }];
    const result = updateLineQuantity(items, productA.id, 'M', 'Noir', 5);
    expect(result[0].quantity).toBe(5);
  });
});

describe('getCartItemCount', () => {
  it('sums quantities across all lines', () => {
    const items: CartItem[] = [
      { productId: productA.id, size: 'M', color: 'Noir', quantity: 2 },
      { productId: productB.id, size: 'S', color: 'Blanc', quantity: 3 }
    ];
    expect(getCartItemCount(items)).toBe(5);
  });
});

describe('getCartSubtotalEur', () => {
  it('sums price × quantity using the persisted line snapshot', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 2, unitPriceEur: productA.priceEur }];
    expect(getCartSubtotalEur(items)).toBe(productA.priceEur * 2);
  });

  it('uses the displayed price snapshot for a database-backed product', () => {
    const items: CartItem[] = [{
      productId: 'dashboard-product', size: 'M', color: 'Noir', quantity: 2, unitPriceEur: 79,
    }];
    expect(getCartSubtotalEur(items)).toBe(158);
  });
});
