import type { Category, LocalizedText } from '@/lib/products';

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  unitPriceEur?: number;
  slug?: string;
  name?: LocalizedText;
  imageUrl?: string;
  category?: Category;
}

function isStoredCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return typeof item.productId === 'string' && typeof item.slug === 'string'
    && typeof item.name?.fr === 'string' && typeof item.name?.en === 'string'
    && typeof item.imageUrl === 'string' && typeof item.category === 'string'
    && typeof item.size === 'string' && typeof item.color === 'string'
    && Number.isInteger(item.quantity) && Number(item.quantity) > 0
    && typeof item.unitPriceEur === 'number' && Number.isFinite(item.unitPriceEur) && item.unitPriceEur >= 0;
}

export function parseStoredCart(raw: string): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredCartItem) : [];
  } catch {
    return [];
  }
}

export function isSameLine(line: CartItem, productId: string, size: string, color: string): boolean {
  return line.productId === productId && line.size === size && line.color === color;
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartSubtotalEur(items: CartItem[]): number {
  return items.reduce((sum, line) => sum + (line.unitPriceEur ?? 0) * line.quantity, 0);
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
