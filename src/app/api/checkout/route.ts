import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CheckoutService } from '@/server/checkout/service';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';
import { DevelopmentNotificationProvider } from '@/server/notifications/development-provider';
import { DevelopmentPaymentProvider } from '@/server/payments/development-provider';
import { GeniusPaymentProvider } from '@/server/payments/genius-provider';

const requestSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  method: z.enum(['stripe', 'genius']),
  shipping: z.object({
    fullName: z.string().trim().min(1), email: z.email(), address: z.string().trim().min(1),
    city: z.string().trim().min(1), postalCode: z.string().trim().min(1), country: z.string().trim().min(1),
  }),
  items: z.array(z.object({
    productId: z.string().min(1), size: z.string().min(1), color: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
});

function countryCode(country: string): string | null {
  const normalized = country.trim().toLowerCase();
  const known: Record<string, string> = {
    france: 'FR', fr: 'FR', royaumeuni: 'GB', 'royaume-uni': 'GB',
    'united kingdom': 'GB', uk: 'GB', gb: 'GB', belgique: 'BE', belgium: 'BE',
    suisse: 'CH', switzerland: 'CH', allemagne: 'DE', germany: 'DE',
    sénégal: 'SN', senegal: 'SN', cameroun: 'CM', cameroon: 'CM',
    'côte d’ivoire': 'CI', "côte d'ivoire": 'CI', 'ivory coast': 'CI',
  };
  return known[normalized] ?? (normalized.length === 2 ? normalized.toUpperCase() : null);
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'PAYMENT_PROVIDER_NOT_CONFIGURED' }, { status: 503 });
  }
  try {
    const input = requestSchema.parse(await request.json());
    const database = await getCommerceDatabase();
    const lines = await Promise.all(input.items.map(async (item) => {
      const variant = (await database.prepare(`SELECT id FROM product_variants
        WHERE product_id = ? AND size = ? AND color = ? AND active = 1`)
        .get(item.productId, item.size, item.color)) as { id: string } | undefined;
      if (!variant) throw new DomainError('NOT_FOUND', 'Variant not found', 404);
      return { variantId: variant.id, quantity: item.quantity };
    }));
    const names = input.shipping.fullName.trim().split(/\s+/);
    const destinationCountryCode = countryCode(input.shipping.country);
    if (!destinationCountryCode) throw new DomainError('CONFLICT', 'Unsupported shipping country');
    const geniusKey = process.env.GENIUS_API_KEY;
    const geniusSecret = process.env.GENIUS_API_SECRET;

    let paymentProvider;
    if (input.method === 'genius' && geniusKey && geniusSecret) {
      paymentProvider = new GeniusPaymentProvider(geniusKey, geniusSecret);
    } else {
      paymentProvider = new DevelopmentPaymentProvider('succeed');
    }

    const checkout = new CheckoutService(
      database,
      paymentProvider,
      new DevelopmentNotificationProvider(database),
    );
    const result = await checkout.start({
      idempotencyKey: input.idempotencyKey,
      currency: 'EUR',
      customer: {
        email: input.shipping.email,
        firstName: names[0],
        lastName: names.slice(1).join(' ') || names[0],
        phone: null,
      },
      shippingAddress: {
        recipient: input.shipping.fullName, line1: input.shipping.address, line2: null,
        postalCode: input.shipping.postalCode, city: input.shipping.city, region: null,
        countryCode: destinationCountryCode,
      },
      lines, shippingMinor: 0, taxMinor: 0, discountMinor: 0,
    });
    return NextResponse.json({
      orderId: result.order.id,
      orderNumber: result.order.number,
      orderStatus: result.order.status,
      paymentStatus: result.payment.status,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'INVALID_CHECKOUT' }, { status: 400 });
    }
    console.error('Checkout failed', error);
    return NextResponse.json({ error: 'CHECKOUT_FAILED' }, { status: 500 });
  }
}
