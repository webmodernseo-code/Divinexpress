import { describe, expect, it } from 'vitest';
import {
  addLine,
  removeLine,
  updateLineQuantity,
  getCartItemCount,
  getCartSubtotalEur,
  CartItem
} from './cart';
import { PRODUCTS } from './products';

const productA = PRODUCTS[0];
const productB = PRODUCTS[1];

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
  it('sums price × quantity using catalog prices', () => {
    const items: CartItem[] = [{ productId: productA.id, size: 'M', color: 'Noir', quantity: 2 }];
    expect(getCartSubtotalEur(items)).toBe(productA.priceEur * 2);
  });
});
