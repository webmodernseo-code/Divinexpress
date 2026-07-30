import { describe, expect, it } from 'vitest';
import { toggleFavoriteId } from './favorites';

describe('toggleFavoriteId', () => {
  it('adds an id that is not yet present', () => {
    expect(toggleFavoriteId([], 'p1')).toEqual(['p1']);
  });

  it('removes an id that is already present', () => {
    expect(toggleFavoriteId(['p1', 'p2'], 'p1')).toEqual(['p2']);
  });
});
