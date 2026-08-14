// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { translateProductText } from './translate';

describe('translateProductText fallback (no API key)', () => {
  let savedKey: string | undefined;
  beforeEach(() => {
    savedKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  });

  it('returns the trimmed source text unchanged and never throws', async () => {
    const result = await translateProductText('  Un sweat premium en coton épais.  ', 'en');
    expect(result).toBe('Un sweat premium en coton épais.');
  });

  it('returns an empty string for blank input without calling the API', async () => {
    expect(await translateProductText('   ', 'fr')).toBe('');
  });
});
