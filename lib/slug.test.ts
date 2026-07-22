import { describe, it, expect } from 'vitest';
import { slugify, dedupeSlug } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Veste Wax Noire')).toBe('veste-wax-noire');
  });

  it('strips accents', () => {
    expect(slugify('Élégance Étoilée')).toBe('elegance-etoilee');
  });

  it('replaces punctuation with hyphens and collapses repeats', () => {
    expect(slugify("T-shirt Éléphant & Co.")).toBe('t-shirt-elephant-co');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
  });
});

describe('dedupeSlug', () => {
  it('returns the base slug unchanged when not taken', () => {
    expect(dedupeSlug('veste-noire', [])).toBe('veste-noire');
  });

  it('appends -2 when the base slug is taken', () => {
    expect(dedupeSlug('veste-noire', ['veste-noire'])).toBe('veste-noire-2');
  });

  it('keeps incrementing until a free slug is found', () => {
    expect(dedupeSlug('veste-noire', ['veste-noire', 'veste-noire-2'])).toBe('veste-noire-3');
  });
});
