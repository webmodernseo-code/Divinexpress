import { describe, expect, it } from 'vitest';
import { MVP_NAVIGATION, MVP_SETTINGS_TABS } from './mvp-config';

describe('dashboard MVP configuration', () => {
  it('keeps only the four essential navigation destinations', () => {
    expect(MVP_NAVIGATION.map((item) => item.id)).toEqual([
      'overview',
      'products',
      'orders',
      'settings',
    ]);
  });

  it('keeps only essential store settings', () => {
    expect(MVP_SETTINGS_TABS).toEqual([
      'general',
      'paiements',
      'livraison',
      'securite',
    ]);
  });
});
