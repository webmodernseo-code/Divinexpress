import { describe, it, expect } from 'vitest';
import { canDelete } from './productDeletion';

describe('canDelete', () => {
  it('allows deletion when there is no order history', () => {
    expect(canDelete(0)).toBe(true);
  });

  it('blocks deletion when there is at least one order', () => {
    expect(canDelete(1)).toBe(false);
    expect(canDelete(5)).toBe(false);
  });
});
