import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { CATEGORIES, PRODUCTS } from '@/lib/products';
import { SITE_URL } from '@/lib/seo';

const STATIC_PATHS = [
  '',
  '/a-propos',
  '/contact',
  '/aide',
  '/livraison-retours',
  '/guide-tailles',
  '/mentions-legales',
  '/cgv',
  '/confidentialite',
  '/favoris',
  '/panier'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${SITE_URL}/${locale}${path}` });
    }
    for (const category of CATEGORIES) {
      // Keep category URLs mapped with search parameters to match current architecture
      entries.push({ url: `${SITE_URL}/${locale}?categorie=${category}` });
    }
    for (const product of PRODUCTS) {
      entries.push({ url: `${SITE_URL}/${locale}/produit/${product.slug}` });
    }
  }

  return entries;
}
