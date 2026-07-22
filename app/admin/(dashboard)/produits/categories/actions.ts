'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { slugify, dedupeSlug } from '@/lib/slug';

export async function createCategory(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) {
    redirect('/admin/produits/categories?error=nom-requis');
  }

  const existingSlugs = (await prisma.category.findMany({ select: { slug: true } })).map((c) => c.slug);
  const slug = dedupeSlug(slugify(name), existingSlugs);

  await prisma.category.create({ data: { name, slug } });
  redirect('/admin/produits/categories');
}

export async function updateCategory(id: string, formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) {
    redirect('/admin/produits/categories?error=nom-requis');
  }

  // The slug is re-derived from the name on every rename. This is a
  // conscious asymmetry with product slugs (which never change after
  // creation): categories are few and rarely renamed, so the SEO cost of an
  // occasional URL change here is acceptable, unlike for products.
  const existingSlugs = (
    await prisma.category.findMany({ where: { id: { not: id } }, select: { slug: true } })
  ).map((c) => c.slug);
  const slug = dedupeSlug(slugify(name), existingSlugs);

  await prisma.category.update({ where: { id }, data: { name, slug } });
  redirect('/admin/produits/categories');
}

export async function deleteCategory(id: string): Promise<void> {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    redirect('/admin/produits/categories?error=categorie-non-vide');
  }

  await prisma.category.delete({ where: { id } });
  redirect('/admin/produits/categories');
}
