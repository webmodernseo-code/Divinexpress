export function totalStock(variants: { stock: number }[]): number {
  return variants.reduce((sum, v) => sum + v.stock, 0);
}

export function priceRange(variants: { priceCents: number }[]): { minCents: number; maxCents: number } | null {
  if (variants.length === 0) return null;
  const prices = variants.map((v) => v.priceCents);
  return { minCents: Math.min(...prices), maxCents: Math.max(...prices) };
}
