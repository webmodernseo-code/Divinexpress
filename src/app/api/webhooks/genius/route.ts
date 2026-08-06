import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getCommerceDatabase } from '@/server/db/runtime';
import { CheckoutService } from '@/server/checkout/service';
import { DevelopmentNotificationProvider } from '@/server/notifications/development-provider';
import { DevelopmentPaymentProvider } from '@/server/payments/development-provider';

export async function POST(req: Request) {
  const signature = req.headers.get('X-Webhook-Signature');
  const timestamp = req.headers.get('X-Webhook-Timestamp');
  const event = req.headers.get('X-Webhook-Event');

  if (!signature || !timestamp || !event) {
    return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
  }

  const rawBody = await req.text();
  const secret = process.env.GENIUS_WEBHOOK_SECRET;

  if (secret) {
    const computedSignature = createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    if (computedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else {
    console.warn('GENIUS_WEBHOOK_SECRET is not configured. Webhook signature verification was bypassed.');
  }

  // Protection replay attack: 5 minutes (300 seconds)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return NextResponse.json({ error: 'Timestamp too old' }, { status: 400 });
  }

  try {
    const payload = JSON.parse(rawBody);

    if (event === 'payment.success') {
      const transaction = payload.data;
      const providerReference = transaction?.reference;
      const providerEventId = payload.id;

      if (!providerReference) {
        return NextResponse.json({ error: 'Missing transaction reference in payload' }, { status: 400 });
      }

      const database = await getCommerceDatabase();
      const checkout = new CheckoutService(
        database,
        new DevelopmentPaymentProvider('succeed'),
        new DevelopmentNotificationProvider(database)
      );

      await checkout.completePayment(providerReference, providerEventId, payload);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
