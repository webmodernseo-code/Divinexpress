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

const DEFAULT_KEYWORDS = [
  'vêtements homme femme enfant',
  'boutique en ligne vêtements',
  'accessoires mode',
  'mode femme',
  'mode homme',
  'mode enfant',
  'DivinExpress'
];

export function buildMetadata({
  locale,
  pathname,
  title,
  description,
  keywords,
  imageUrl
}: {
  locale: string;
  pathname: string;
  title: string;
  description: string;
  keywords?: string[];
  imageUrl?: string;
}): Metadata {
  const url = `${SITE_URL}/${locale}${pathname}`;
  const image = imageUrl ?? `${SITE_URL}/branding/logo-divinexpress.png`;
  return {
    title,
    description,
    keywords: [...(keywords ?? []), ...DEFAULT_KEYWORDS],
    alternates: {
      canonical: url,
      languages: buildAlternateLanguages(pathname)
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'DivinExpress',
      images: [{ url: image }],
      locale,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DivinExpress',
    url: SITE_URL,
    logo: `${SITE_URL}/branding/logo-divinexpress.png`,
    description:
      'DivinExpress est une plateforme de shopping en ligne de vêtements et accessoires pour femme, homme et enfant.'
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
  imageUrl,
  brand,
  category,
  inStock = true
}: {
  name: string;
  description: string;
  url: string;
  priceEur: number;
  imageUrl: string;
  brand?: string;
  category?: string;
  inStock?: boolean;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: [imageUrl],
    ...(category ? { category } : {}),
    brand: {
      '@type': 'Brand',
      name: brand && brand.trim().length > 0 ? brand : 'DivinExpress'
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: priceEur.toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  };
}
