// lib/orderNumber.test.ts
import { describe, it, expect } from 'vitest';
import { generateOrderNumber } from './orderNumber';

describe('generateOrderNumber', () => {
  it('matches the format DX-YYYYMMDD-XXXXXXXX for a given date', () => {
    const result = generateOrderNumber(new Date('2026-07-23T10:00:00Z'));
    expect(result).toMatch(/^DX-20260723-[0-9A-F]{8}$/);
  });

  it('produces different values on successive calls for the same date', () => {
    const date = new Date('2026-07-23T10:00:00Z');
    const a = generateOrderNumber(date);
    const b = generateOrderNumber(date);
    expect(a).not.toBe(b);
  });

  it('defaults to the current date when none is given', () => {
    const result = generateOrderNumber();
    const todayPart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    expect(result.startsWith(`DX-${todayPart}-`)).toBe(true);
  });
});
