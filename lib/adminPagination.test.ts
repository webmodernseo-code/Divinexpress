import { describe, it, expect } from 'vitest';
import { parsePage, pageHref } from './adminPagination';

describe('parsePage', () => {
  it('defaults to 1 when no page param is present', () => {
    expect(parsePage(new URLSearchParams())).toBe(1);
  });

  it('parses a valid page number', () => {
    expect(parsePage(new URLSearchParams('page=3'))).toBe(3);
  });

  it('falls back to 1 for a non-numeric or non-positive value', () => {
    expect(parsePage(new URLSearchParams('page=abc'))).toBe(1);
    expect(parsePage(new URLSearchParams('page=0'))).toBe(1);
    expect(parsePage(new URLSearchParams('page=-2'))).toBe(1);
  });
});

describe('pageHref', () => {
  it('omits the page param for page 1', () => {
    expect(pageHref(new URLSearchParams('q=veste&page=3'), 1)).toBe('?q=veste');
  });

  it('sets the page param and preserves other params', () => {
    expect(pageHref(new URLSearchParams('q=veste'), 2)).toBe('?q=veste&page=2');
  });
});
