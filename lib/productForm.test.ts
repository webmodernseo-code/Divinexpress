import { describe, it, expect } from 'vitest';
import { parseVariantRows } from './productForm';

describe('parseVariantRows', () => {
  it('parses a single row', () => {
    const fields: [string, string][] = [
      ['variants[0][id]', ''],
      ['variants[0][size]', 'M'],
      ['variants[0][color]', 'Noir'],
      ['variants[0][price]', '49.90'],
      ['variants[0][compareAtPrice]', ''],
      ['variants[0][stock]', '12'],
      ['variants[0][sku]', 'VEST-NOIR-M']
    ];
    expect(parseVariantRows(fields)).toEqual([
      { id: null, size: 'M', color: 'Noir', priceCents: 4990, compareAtPriceCents: null, stock: 12, sku: 'VEST-NOIR-M' }
    ]);
  });

  it('parses multiple rows in index order regardless of field order', () => {
    const fields: [string, string][] = [
      ['variants[1][sku]', 'VEST-NOIR-L'],
      ['variants[0][sku]', 'VEST-NOIR-M'],
      ['variants[1][size]', 'L'],
      ['variants[0][size]', 'M'],
      ['variants[0][color]', 'Noir'],
      ['variants[1][color]', 'Noir'],
      ['variants[0][price]', '49.90'],
      ['variants[1][price]', '49.90'],
      ['variants[0][stock]', '5'],
      ['variants[1][stock]', '3']
    ];
    const result = parseVariantRows(fields);
    expect(result.map((r) => r.sku)).toEqual(['VEST-NOIR-M', 'VEST-NOIR-L']);
  });

  it('keeps an existing variant id when present', () => {
    const fields: [string, string][] = [
      ['variants[0][id]', 'clx123'],
      ['variants[0][size]', 'M'],
      ['variants[0][color]', 'Noir'],
      ['variants[0][price]', '49.90'],
      ['variants[0][stock]', '5'],
      ['variants[0][sku]', 'VEST-NOIR-M']
    ];
    expect(parseVariantRows(fields)[0].id).toBe('clx123');
  });

  it('parses a compare-at price when provided', () => {
    const fields: [string, string][] = [
      ['variants[0][id]', ''],
      ['variants[0][size]', 'M'],
      ['variants[0][color]', 'Noir'],
      ['variants[0][price]', '39.90'],
      ['variants[0][compareAtPrice]', '59.90'],
      ['variants[0][stock]', '5'],
      ['variants[0][sku]', 'VEST-NOIR-M']
    ];
    expect(parseVariantRows(fields)[0].compareAtPriceCents).toBe(5990);
  });

  it('ignores unrelated form fields', () => {
    const fields: [string, string][] = [
      ['nameFr', 'Veste'],
      ['variants[0][id]', ''],
      ['variants[0][size]', 'M'],
      ['variants[0][color]', 'Noir'],
      ['variants[0][price]', '49.90'],
      ['variants[0][stock]', '5'],
      ['variants[0][sku]', 'VEST-NOIR-M']
    ];
    expect(parseVariantRows(fields)).toHaveLength(1);
  });
});
