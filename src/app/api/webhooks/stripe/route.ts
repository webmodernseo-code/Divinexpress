import { NextResponse } from 'next/server';
import { getCommerceDatabase } from '@/server/db/runtime';
import { CheckoutService } from '@/server/checkout/service';
import { DevelopmentNotificationProvider } from '@/server/notifications/development-provider';
import { DevelopmentPaymentProvider } from '@/server/payments/development-provider';
import { verifyStripeSignature } from '@/server/payments/stripe-webhook';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');

  if (secret) {
    if (!verifyStripeSignature(signature, rawBody, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else {
    console.warn('STRIPE_WEBHOOK_SECRET is not configured. Webhook signature verification was bypassed.');
  }

  try {
    const event = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: { object?: { id?: string } };
    };

    if (event.type === 'checkout.session.completed') {
      const providerReference = event.data?.object?.id;
      if (!providerReference) {
        return NextResponse.json({ error: 'Missing session id in payload' }, { status: 400 });
      }
      const database = await getCommerceDatabase();
      const checkout = new CheckoutService(
        database,
        new DevelopmentPaymentProvider('succeed'),
        new DevelopmentNotificationProvider(database)
      );
      await checkout.completePayment(providerReference, event.id ?? providerReference, event);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing failed:', err);
    return NextResponse.json({ error: 'WEBHOOK_FAILED' }, { status: 500 });
  }
}
