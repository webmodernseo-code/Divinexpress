import type { PaymentProvider, PaymentRequest, PaymentResult } from './provider';

/**
 * Stripe Checkout (hosted page). Creates a Checkout Session via the Stripe REST
 * API and returns its hosted URL. Mirrors GeniusPaymentProvider: the order is
 * finalized later by the Stripe webhook (checkout.session.completed), which
 * matches on the session id stored as the payment's provider reference.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'stripe';

  constructor(private readonly secretKey: string) {}

  async start(request: PaymentRequest): Promise<PaymentResult> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3210';
    const successUrl = `${siteUrl}/fr/commande/confirmation?order=${encodeURIComponent(request.orderNumber)}`;
    const cancelUrl = `${siteUrl}/fr/commande/paiement?error=payment_failed`;

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', successUrl);
    body.set('cancel_url', cancelUrl);
    body.set('client_reference_id', request.orderNumber);
    body.set('line_items[0][quantity]', '1');
    body.set('line_items[0][price_data][currency]', request.currency.toLowerCase());
    body.set('line_items[0][price_data][unit_amount]', String(request.amountMinor));
    body.set('line_items[0][price_data][product_data][name]', `DivinExpress Order #${request.orderNumber}`);
    body.set('metadata[orderId]', request.orderId);
    body.set('metadata[orderNumber]', request.orderNumber);
    body.set('metadata[idempotencyKey]', request.idempotencyKey);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': request.idempotencyKey,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe API error: ${response.status} - ${errorText}`);
    }

    const session = (await response.json()) as { id: string; url: string | null };
    if (!session.url) {
      throw new Error('No checkout URL returned from Stripe');
    }

    return {
      providerReference: session.id,
      providerEventId: `stripe_evt_init_${request.idempotencyKey}`,
      status: 'pending',
      payload: { checkoutUrl: session.url, stripeSessionId: session.id },
    };
  }
}
