export type ProductStatus = 'active' | 'draft' | 'archived';

export type ProductVariantItem = { id: string; size: string | null; color: string | null; stock: number };

export type ProductItem = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  categoryId: string;
  brand: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
  descriptionFr: string;
  descriptionEn: string;
  compareAtEur: number | null;
  images: string[];
  variants: ProductVariantItem[];
};

export interface CatalogProductRaw {
  id: string;
  categoryId: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  status: ProductStatus;
  brand?: string | null;
  images?: string[];
  compareAtMinor?: number | null;
  variants: Array<{
    id: string;
    size: string | null;
    color: string | null;
    priceMinor: number;
    stock: number;
  }>;
}

export const categoryMap: Record<string, { fr: string; en: string }> = {
  'category:homme': { fr: 'Homme', en: 'Men' },
  'category:femme': { fr: 'Femme', en: 'Women' },
  'category:enfant': { fr: 'Enfant', en: 'Kids' },
  'category:accessoires': { fr: 'Accessoires', en: 'Accessories' }
};

export const getProductImage = (productId: string, category: string) => {
  if (productId.toLowerCase().includes('hoodie')) return '/image/reign-admin-hoodie.png';
  if (category.toLowerCase().includes('femme') || category.toLowerCase().includes('women')) return '/image/category_femme.png';
  if (category.toLowerCase().includes('enfant') || category.toLowerCase().includes('kids')) return '/image/category_enfant.png';
  if (category.toLowerCase().includes('accessoires') || category.toLowerCase().includes('accessories')) return '/image/category_accessoires.png';
  return '/image/category_homme.png';
};

export function mapCatalogProduct(p: CatalogProductRaw): ProductItem {
  const cat = categoryMap[p.categoryId] || { fr: p.categoryId, en: p.categoryId };
  const firstVariant = p.variants?.[0];
  const price = firstVariant ? firstVariant.priceMinor / 100 : 0;
  const stock = p.variants?.reduce((acc: number, v) => acc + (v.stock || 0), 0) || 0;
  return {
    id: p.id,
    name: p.nameFr,
    nameEn: p.nameEn,
    category: cat.fr,
    categoryEn: cat.en,
    categoryId: p.categoryId,
    brand: p.brand ?? '',
    price,
    stock,
    status: p.status,
    image: p.images?.[0] ?? getProductImage(p.id, cat.fr),
    descriptionFr: p.descriptionFr || '',
    descriptionEn: p.descriptionEn || '',
    compareAtEur: p.compareAtMinor != null ? p.compareAtMinor / 100 : null,
    images: p.images ?? [],
    variants: (p.variants ?? []).map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock ?? 0 })),
  };
}
