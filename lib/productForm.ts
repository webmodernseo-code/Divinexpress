export type ParsedVariantRow = {
  id: string | null;
  size: string;
  color: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  sku: string;
};

const ROW_FIELD_PATTERN = /^variants\[(\d+)\]\[(\w+)\]$/;

export function parseVariantRows(fields: [string, string][]): ParsedVariantRow[] {
  const rows = new Map<number, Record<string, string>>();

  for (const [key, value] of fields) {
    const match = ROW_FIELD_PATTERN.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    const field = match[2];
    const row = rows.get(index) ?? {};
    row[field] = value;
    rows.set(index, row);
  }

  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => ({
      id: row.id && row.id.length > 0 ? row.id : null,
      size: row.size ?? '',
      color: row.color ?? '',
      priceCents: Math.round(Number(row.price ?? '0') * 100),
      compareAtPriceCents:
        row.compareAtPrice && row.compareAtPrice.length > 0 ? Math.round(Number(row.compareAtPrice) * 100) : null,
      stock: Number(row.stock ?? '0'),
      sku: row.sku ?? ''
    }));
}

export function toVariantData(variant: ParsedVariantRow) {
  return {
    size: variant.size,
    color: variant.color,
    priceCents: variant.priceCents,
    compareAtPriceCents: variant.compareAtPriceCents,
    stock: variant.stock,
    sku: variant.sku
  };
}
