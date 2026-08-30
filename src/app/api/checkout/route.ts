import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CheckoutService } from '@/server/checkout/service';
import { getCommerceDatabase } from '@/server/db/runtime';
import { DomainError } from '@/server/domain/errors';
import { DevelopmentNotificationProvider } from '@/server/notifications/development-provider';
import { GeniusPaymentProvider } from '@/server/payments/genius-provider';
import { StripePaymentProvider } from '@/server/payments/stripe-provider';
import type { PaymentProvider } from '@/server/payments/provider';
import type { Database } from '@/server/db/client';
import { readStoreSettings } from '@/server/settings/store-settings';
import { shippingMinorFor } from '@/server/settings/shipping';

const requestSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  method: z.enum(['stripe', 'genius']),
  shipping: z.object({
    fullName: z.string().trim().min(1), email: z.email(), address: z.string().trim().min(1),
    city: z.string().optional(), postalCode: z.string().optional(), country: z.string().trim().min(1),
    countryCode: z.string().trim().length(2), phone: z.string().optional(),
    region: z.enum(['europe', 'africa']).optional(),
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

async function paymentRegionEnabled(database: Database, region: 'europe' | 'africa'): Promise<boolean> {
  const key = region === 'europe' ? 'payment_europe_enabled' : 'payment_africa_enabled';
  const row = (await database.prepare('SELECT value_json FROM store_settings WHERE key = ?').get(key)) as
    | { value_json: string }
    | undefined;
  return row ? JSON.parse(row.value_json) !== false : true;
}

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const database = await getCommerceDatabase();
    const storeSettings = await readStoreSettings(database);
    if (!storeSettings.shop_enabled) {
      throw new DomainError('SHOP_CLOSED', 'Store is closed', 503);
    }
    const requestedRegion = input.shipping.region ?? 'europe';
    if (!await paymentRegionEnabled(database, requestedRegion)) {
      throw new DomainError('PAYMENT_METHOD_UNAVAILABLE', 'Payment region is disabled', 409);
    }
    if ((requestedRegion === 'europe' && input.method !== 'stripe') || (requestedRegion === 'africa' && input.method !== 'genius')) {
      throw new DomainError('PAYMENT_METHOD_UNAVAILABLE', 'Payment method does not match shipping region', 409);
    }
    let subtotalMinor = 0;
    const lines = await Promise.all(input.items.map(async (item) => {
      const variant = (await database.prepare(`SELECT id, price_minor FROM product_variants
        WHERE product_id = ? AND size = ? AND color = ? AND active = 1`)
        .get(item.productId, item.size, item.color)) as { id: string; price_minor: number } | undefined;
      if (!variant) throw new DomainError('NOT_FOUND', 'Variant not found', 404);
      subtotalMinor += variant.price_minor * item.quantity;
      return { variantId: variant.id, quantity: item.quantity };
    }));
    const names = input.shipping.fullName.trim().split(/\s+/);
    // The client provides the ISO alpha-2 code (from Photon or the country select);
    // fall back to the legacy name map only if it is somehow missing.
    const destinationCountryCode =
      input.shipping.countryCode?.trim().toUpperCase() || countryCode(input.shipping.country);
    if (!destinationCountryCode) throw new DomainError('CONFLICT', 'Unsupported shipping country');
    const geniusKey = process.env.GENIUS_API_KEY;
    const geniusSecret = process.env.GENIUS_API_SECRET;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    let paymentProvider: PaymentProvider;
    if (input.method === 'genius' && geniusKey && geniusSecret) {
      paymentProvider = new GeniusPaymentProvider(geniusKey, geniusSecret);
    } else if (input.method === 'stripe' && stripeSecret) {
      paymentProvider = new StripePaymentProvider(stripeSecret);
    } else {
      throw new DomainError('PAYMENT_PROVIDER_NOT_CONFIGURED', 'Payment provider not configured', 503);
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
        phone: input.shipping.phone?.trim() || null,
      },
      shippingAddress: {
        recipient: input.shipping.fullName, line1: input.shipping.address, line2: null,
        postalCode: input.shipping.postalCode?.trim() || null, city: input.shipping.city?.trim() || null,
        region: null, countryCode: destinationCountryCode,
      },
      lines, shippingMinor: shippingMinorFor(subtotalMinor, storeSettings), taxMinor: 0, discountMinor: 0,
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

export async function GET(request: Request) {
  const region = new URL(request.url).searchParams.get('region') === 'africa' ? 'africa' : 'europe';
  const database = await getCommerceDatabase();
  const settings = await readStoreSettings(database);
  if (!settings.shop_enabled) {
    return NextResponse.json({
      shopClosed: true,
      methods: { stripe: { status: 'unavailable' }, genius: { status: 'unavailable' } },
    });
  }
  const regionEnabled = await paymentRegionEnabled(database, region);
  const geniusConfigured = Boolean(process.env.GENIUS_API_KEY && process.env.GENIUS_API_SECRET);
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  return NextResponse.json({
    methods: {
      stripe: { status: region === 'europe' && regionEnabled && stripeConfigured ? 'configured' : 'unavailable' },
      genius: { status: region === 'africa' && regionEnabled && geniusConfigured ? 'configured' : 'unavailable' },
    },
  });
}
