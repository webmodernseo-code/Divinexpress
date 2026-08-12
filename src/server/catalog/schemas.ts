import { z } from 'zod';

export const productVariantInputSchema = z.object({
  id: z.string().min(1),
  sku: z.string().trim().min(1).max(80),
  size: z.string().trim().min(1).nullable(),
  color: z.string().trim().min(1).nullable(),
  priceMinor: z.number().int().nonnegative(),
  currency: z.enum(['EUR', 'GBP']),
});

export const createProductInputSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nameFr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  descriptionFr: z.string(),
  descriptionEn: z.string(),
  images: z.array(z.string().url()).max(6).optional(),
  compareAtPriceMinor: z.number().int().nonnegative().optional(),
  variants: z.array(productVariantInputSchema).min(1),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
