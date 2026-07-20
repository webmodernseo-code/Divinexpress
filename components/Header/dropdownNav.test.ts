import { describe, it, expect } from 'vitest';
import { getNextIndex } from './dropdownNav';

describe('getNextIndex', () => {
  it('moves to the next index on ArrowDown', () => {
    expect(getNextIndex(0, 'ArrowDown', 3)).toBe(1);
  });

  it('wraps to the first index on ArrowDown from the last', () => {
    expect(getNextIndex(2, 'ArrowDown', 3)).toBe(0);
  });

  it('moves to the previous index on ArrowUp', () => {
    expect(getNextIndex(1, 'ArrowUp', 3)).toBe(0);
  });

  it('wraps to the last index on ArrowUp from the first', () => {
    expect(getNextIndex(0, 'ArrowUp', 3)).toBe(2);
  });

  it('stays at 0 for a single-option list', () => {
    expect(getNextIndex(0, 'ArrowDown', 1)).toBe(0);
    expect(getNextIndex(0, 'ArrowUp', 1)).toBe(0);
  });
});
