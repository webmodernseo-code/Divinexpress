import type { Product, Category, Locale } from '@/lib/products';
import type { Database } from '../db/client';
import { CatalogRepository, type CatalogProduct } from './repository';

const categories = new Set<Category>(['homme', 'femme', 'enfant', 'accessoires']);

function unique(values: Array<string | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function normalizeSearchText(value: string, locale: Locale): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase(locale);
}

function toStorefrontProduct(product: CatalogProduct): Product | null {
  const category = product.categoryId.replace(/^category:/, '') as Category;
  if (product.status !== 'active' || !categories.has(category) || product.variants.length === 0) return null;

  const sizes = unique(product.variants.map((variant) => variant.size));
  const colors = unique(product.variants.map((variant) => variant.color));

  return {
    id: product.id,
    slug: product.slug,
    category,
    subcategory: '',
    name: { fr: product.nameFr, en: product.nameEn },
    description: { fr: product.descriptionFr, en: product.descriptionEn },
    priceEur: product.variants[0].priceMinor / 100,
    sizes: sizes.length > 0 ? sizes : ['UNIQUE'],
    colors: colors.length > 0 ? colors : ['Noir'],
    imageCount: Math.max(1, colors.length),
    availableQuantity: product.variants.reduce((total, variant) => total + Math.max(0, variant.stock), 0),
    images: product.images,
    compareAtEur: product.compareAtMinor != null ? product.compareAtMinor / 100 : undefined,
    brand: product.brand ?? undefined,
  };
}

export class StorefrontCatalog {
  private readonly repository: CatalogRepository;

  constructor(database: Database) {
    this.repository = new CatalogRepository(database);
  }

  async list(): Promise<Product[]> {
    const products = await this.repository.listProducts();
    return products.map(toStorefrontProduct).filter((product): product is Product => product !== null);
  }

  async search(query: string, locale: Locale): Promise<Product[]> {
    const normalizedQuery = normalizeSearchText(query.trim(), locale);
    if (!normalizedQuery) return [];

    const products = await this.list();
    return products.filter((product) => {
      const searchableText = `${product.name[locale]} ${product.description[locale]}`;
      return normalizeSearchText(searchableText, locale).includes(normalizedQuery);
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const product = await this.repository.findBySlug(slug);
    return product ? toStorefrontProduct(product) : null;
  }
}
