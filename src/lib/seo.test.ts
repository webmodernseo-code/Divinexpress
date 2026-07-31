import { describe, expect, it } from 'vitest';
import { buildAlternateLanguages, breadcrumbJsonLd, productJsonLd } from './seo';

describe('buildAlternateLanguages', () => {
  it('returns an entry for each locale plus x-default', () => {
    const result = buildAlternateLanguages('/homme');
    expect(result.fr).toContain('/fr/homme');
    expect(result.en).toContain('/en/homme');
    expect(result['x-default']).toContain('/fr/homme');
  });
});

describe('breadcrumbJsonLd', () => {
  it('builds a positioned ListItem for each entry', () => {
    const result = breadcrumbJsonLd([
      { name: 'Accueil', url: 'https://example.com/fr' },
      { name: 'Homme', url: 'https://example.com/fr/homme' }
    ]);
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
  });
});

describe('productJsonLd', () => {
  it('formats the price as a fixed 2-decimal string', () => {
    const result = productJsonLd({
      name: 'Veste',
      description: 'Une veste',
      url: 'https://example.com/fr/produit/veste',
      priceEur: 320,
      imageUrl: 'https://example.com/placeholder.png'
    });
    expect(result.offers.price).toBe('320.00');
  });
});
