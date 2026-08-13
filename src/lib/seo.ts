import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

export const SITE_URL = 'https://divinexpress.fr';

export function buildAlternateLanguages(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${SITE_URL}/${locale}${pathname}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${pathname}`;
  return languages;
}

export function buildMetadata({
  locale,
  pathname,
  title,
  description
}: {
  locale: string;
  pathname: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}${pathname}`,
      languages: buildAlternateLanguages(pathname)
    }
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DivinExpress',
    url: SITE_URL,
    logo: `${SITE_URL}/branding/logo-reign.png`
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function productJsonLd({
  name,
  description,
  url,
  priceEur,
  imageUrl
}: {
  name: string;
  description: string;
  url: string;
  priceEur: number;
  imageUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: [imageUrl],
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: priceEur.toFixed(2),
      availability: 'https://schema.org/InStock'
    }
  };
}
