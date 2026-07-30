import { describe, expect, it } from 'vitest';
import { buttonClassName } from './Button';

describe('buttonClassName', () => {
  it('returns a dark-filled style for the primary variant', () => {
    expect(buttonClassName('primary')).toContain('bg-ink');
  });

  it('returns an outlined style for the secondary variant', () => {
    expect(buttonClassName('secondary')).toContain('border-ink');
  });

  it('defaults to the primary variant', () => {
    expect(buttonClassName()).toBe(buttonClassName('primary'));
  });
});
