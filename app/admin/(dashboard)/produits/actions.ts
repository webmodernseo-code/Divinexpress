'use server';

import { redirect } from 'next/navigation';
import { Prisma, type ProductStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { slugify, dedupeSlug } from '@/lib/slug';
import { parseVariantRows, toVariantData, type ParsedVariantRow } from '@/lib/productForm';
import { canDelete } from '@/lib/productDeletion';
import { deleteCloudinaryImage } from '@/lib/cloudinary';

export type ProductActionState = { error: string | null };

const VALID_STATUSES: ProductStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

type ProductFields = {
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  categoryId: string;
  status: ProductStatus;
  featured: boolean;
};

function readProductFields(formData: FormData): ProductFields {
  return {
    nameFr: String(formData.get('nameFr') ?? '').trim(),
    nameEn: String(formData.get('nameEn') ?? '').trim(),
    descriptionFr: String(formData.get('descriptionFr') ?? '').trim(),
    descriptionEn: String(formData.get('descriptionEn') ?? '').trim(),
    categoryId: String(formData.get('categoryId') ?? ''),
    status: String(formData.get('status') ?? 'DRAFT') as ProductStatus,
    featured: formData.get('featured') === 'on'
  };
}

function validateProductFields(fields: ProductFields): string | null {
  if (!fields.nameFr || !fields.nameEn || !fields.descriptionFr || !fields.descriptionEn || !fields.categoryId) {
    return 'Merci de renseigner tous les champs obligatoires.';
  }
  if (!VALID_STATUSES.includes(fields.status)) {
    return 'Statut invalide.';
  }
  return null;
}

function validateVariants(variants: ParsedVariantRow[]): string | null {
  if (variants.length === 0) {
    return 'Ajoutez au moins une variante (taille, couleur, prix, stock).';
  }
  for (const variant of variants) {
    if (!variant.size || !variant.color || !variant.sku || variant.priceCents <= 0 || variant.stock < 0) {
      return 'Merci de compléter correctement chaque variante (taille, couleur, prix, stock, SKU).';
    }
  }
  return null;
}

function formEntries(formData: FormData): [string, string][] {
  return [...formData.entries()].map(([key, value]) => [key, String(value)]);
}

export async function createProduct(prevState: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const fields = readProductFields(formData);
  const fieldsError = validateProductFields(fields);
  if (fieldsError) return { error: fieldsError };

  const variants = parseVariantRows(formEntries(formData));
  const variantsError = validateVariants(variants);
  if (variantsError) return { error: variantsError };

  const existingSlugs = (await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug);
  const slug = dedupeSlug(slugify(fields.nameFr), existingSlugs);

  let productId: string;
  try {
    const product = await prisma.product.create({
      data: {
        ...fields,
        slug,
        variants: {
          create: variants.map((v) => toVariantData(v))
        }
      }
    });
    productId = product.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { error: 'Ce SKU est déjà utilisé par une autre variante.' };
    }
    throw err;
  }

  redirect(`/admin/produits/${productId}`);
}

export async function updateProduct(
  id: string,
  prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const fields = readProductFields(formData);
  const fieldsError = validateProductFields(fields);
  if (fieldsError) return { error: fieldsError };

  const variants = parseVariantRows(formEntries(formData));
  const variantsError = validateVariants(variants);
  if (variantsError) return { error: variantsError };

  // slug is intentionally not touched here — see Global Constraints.
  const existingVariants = await prisma.productVariant.findMany({ where: { productId: id } });
  const submittedIds = new Set(variants.filter((v) => v.id !== null).map((v) => v.id));
  const removedVariants = existingVariants.filter((v) => !submittedIds.has(v.id));

  for (const removed of removedVariants) {
    const orderedCount = await prisma.orderItem.count({ where: { variantId: removed.id } });
    if (!canDelete(orderedCount)) {
      return {
        error: 'Cette variante a déjà été commandée et ne peut pas être supprimée — passez son stock à 0 à la place.'
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: fields });

      for (const removed of removedVariants) {
        await tx.productVariant.delete({ where: { id: removed.id, productId: id } });
      }

      for (const variant of variants) {
        const data = toVariantData(variant);
        if (variant.id) {
          await tx.productVariant.update({ where: { id: variant.id, productId: id }, data });
        } else {
          await tx.productVariant.create({ data: { ...data, productId: id } });
        }
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { error: 'Ce SKU est déjà utilisé par une autre variante.' };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return {
        error: 'Cette variante a déjà été commandée et ne peut pas être supprimée — passez son stock à 0 à la place.'
      };
    }
    throw err;
  }

  redirect(`/admin/produits/${id}`);
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<void> {
  await prisma.product.update({ where: { id }, data: { status } });
  redirect('/admin/produits');
}

export async function deleteProduct(id: string): Promise<void> {
  const orderedCount = await prisma.orderItem.count({ where: { variant: { productId: id } } });
  if (!canDelete(orderedCount)) {
    redirect('/admin/produits?error=commandes-existantes');
  }

  const images = await prisma.productImage.findMany({
    where: { productId: id },
    select: { cloudinaryPublicId: true }
  });

  try {
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } })
    ]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      redirect('/admin/produits?error=commandes-existantes');
    }
    throw err;
  }

  await Promise.all(
    images
      .filter((img): img is { cloudinaryPublicId: string } => img.cloudinaryPublicId !== null)
      .map((img) => deleteCloudinaryImage(img.cloudinaryPublicId))
  );

  redirect('/admin/produits');
}
