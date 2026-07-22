import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { updateProduct } from '../actions';
import { ProductForm } from '@/components/Admin/ProductForm';
import { ProductImageManager } from '@/components/Admin/ProductImageManager';
import styles from '../page.module.css';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      variants: true,
      images: { orderBy: { position: 'asc' } },
      category: true
    }
  });

  if (!product) notFound();

  const orderedVariantIds = new Set(
    (
      await prisma.orderItem.findMany({
        where: { variantId: { in: product.variants.map((v) => v.id) } },
        select: { variantId: true },
        distinct: ['variantId']
      })
    ).map((item) => item.variantId)
  );

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  const formProduct = {
    id: product.id,
    nameFr: product.nameFr,
    nameEn: product.nameEn,
    descriptionFr: product.descriptionFr,
    descriptionEn: product.descriptionEn,
    categoryId: product.categoryId,
    status: product.status,
    featured: product.featured,
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      priceCents: v.priceCents,
      compareAtPriceCents: v.compareAtPriceCents,
      stock: v.stock,
      sku: v.sku,
      hasOrders: orderedVariantIds.has(v.id)
    }))
  };

  return (
    <div>
      <h1 className={styles.title}>{product.nameFr}</h1>
      <ProductForm
        mode="edit"
        categories={categories}
        product={formProduct}
        action={updateProduct.bind(null, product.id)}
      />
      <ProductImageManager productId={product.id} initialImages={product.images} />
    </div>
  );
}
