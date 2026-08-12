import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { signUpload } from './cloudinary';

describe('signUpload', () => {
  it('sorts params and hashes with the secret (Cloudinary scheme)', () => {
    const sig = signUpload({ timestamp: '1700000000', folder: 'reign/products' }, 'SECRET');
    const expected = createHash('sha1')
      .update('folder=reign/products&timestamp=1700000000SECRET')
      .digest('hex');
    expect(sig).toBe(expected);
  });

  it('is stable regardless of input key order', () => {
    const a = signUpload({ folder: 'reign/products', timestamp: '1' }, 'S');
    const b = signUpload({ timestamp: '1', folder: 'reign/products' }, 'S');
    expect(a).toBe(b);
  });
});
