import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { CATEGORIES } from '@/lib/products';
import { SITE_URL } from '@/lib/seo';
import { getCommerceDatabase } from '@/server/db/runtime';
import { StorefrontCatalog } from '@/server/catalog/storefront';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const products = await new StorefrontCatalog(await getCommerceDatabase()).list();

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${SITE_URL}/${locale}${path}` });
    }
    for (const category of CATEGORIES) {
      // Keep category URLs mapped with search parameters to match current architecture
      entries.push({ url: `${SITE_URL}/${locale}?categorie=${category}` });
    }
    for (const product of products) {
      entries.push({ url: `${SITE_URL}/${locale}/produit/${product.slug}` });
    }
  }

  return entries;
}
