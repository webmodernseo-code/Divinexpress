import { describe, it, expect } from 'vitest';
import { getLocalizedField } from './i18n-utils';

describe('getLocalizedField', () => {
  const dummy = {
    nameFr: 'Veste wax',
    nameEn: 'Wax jacket',
    descriptionFr: 'Description en français',
    descriptionEn: 'Description in English',
    other: 'value'
  };

  it('should return French value for locale "fr"', () => {
    expect(getLocalizedField(dummy, 'name', 'fr')).toBe('Veste wax');
    expect(getLocalizedField(dummy, 'description', 'fr')).toBe('Description en français');
  });

  it('should return English value for locale "en"', () => {
    expect(getLocalizedField(dummy, 'name', 'en')).toBe('Wax jacket');
    expect(getLocalizedField(dummy, 'description', 'en')).toBe('Description in English');
  });

  it('should fallback to base field or empty string if localized key is not present', () => {
    expect(getLocalizedField(dummy, 'other', 'fr')).toBe('value');
    expect(getLocalizedField(dummy, 'nonexistent', 'fr')).toBe('');
  });
});
