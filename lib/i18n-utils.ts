import type { Locale } from '@/i18n';

export function getLocalizedField<T extends Record<string, any>>(
  obj: T,
  baseField: string,
  locale: Locale
): any {
  const suffix = locale === 'fr' ? 'Fr' : 'En';
  const key = `${baseField}${suffix}`;

  if (obj && key in obj) {
    return obj[key];
  }

  if (obj && baseField in obj) {
    return obj[baseField];
  }

  return '';
}
