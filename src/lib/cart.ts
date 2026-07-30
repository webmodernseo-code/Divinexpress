import { getProductById } from '@/lib/products';

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export function isSameLine(line: CartItem, productId: string, size: string, color: string): boolean {
  return line.productId === productId && line.size === size && line.color === color;
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartSubtotalEur(items: CartItem[]): number {
  return items.reduce((sum, line) => {
    const product = getProductById(line.productId);
    return sum + (product ? product.priceEur * line.quantity : 0);
  }, 0);
}

export function addLine(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find((line) => isSameLine(line, item.productId, item.size, item.color));
  if (existing) {
    return items.map((line) =>
      isSameLine(line, item.productId, item.size, item.color)
        ? { ...line, quantity: line.quantity + item.quantity }
        : line
    );
  }
  return [...items, item];
}

export function removeLine(items: CartItem[], productId: string, size: string, color: string): CartItem[] {
  return items.filter((line) => !isSameLine(line, productId, size, color));
}

export function updateLineQuantity(
  items: CartItem[],
  productId: string,
  size: string,
  color: string,
  quantity: number
): CartItem[] {
  return items.map((line) => (isSameLine(line, productId, size, color) ? { ...line, quantity } : line));
}
