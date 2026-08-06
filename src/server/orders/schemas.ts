import { z } from 'zod';

const nullableText = z.string().trim().min(1).nullable();

export const createOrderInputSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  currency: z.enum(['EUR', 'GBP']),
  customer: z.object({
    email: z.email(), firstName: z.string().trim().min(1), lastName: z.string().trim().min(1),
    phone: nullableText,
  }),
  shippingAddress: z.object({
    recipient: z.string().trim().min(1), line1: z.string().trim().min(1), line2: nullableText,
    postalCode: z.string().trim().min(1), city: z.string().trim().min(1), region: nullableText,
    countryCode: z.string().length(2).transform((value) => value.toUpperCase()),
  }),
  lines: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive() })).min(1),
  shippingMinor: z.number().int().nonnegative(),
  taxMinor: z.number().int().nonnegative(),
  discountMinor: z.number().int().nonnegative(),
});

export type CreateOrderInput = z.input<typeof createOrderInputSchema>;
