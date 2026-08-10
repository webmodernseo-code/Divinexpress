import { z } from 'zod';

const checkoutResponseSchema = z.object({
  orderNumber: z.string().min(1),
  checkoutUrl: z.url().optional(),
});

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

export async function readCheckoutResponse(response: Response): Promise<CheckoutResponse> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(payload);
    throw new Error(error.success ? error.data.error : `CHECKOUT_HTTP_${response.status}`);
  }
  const result = checkoutResponseSchema.safeParse(payload);
  if (!result.success) throw new Error('INVALID_CHECKOUT_RESPONSE');
  return result.data;
}
