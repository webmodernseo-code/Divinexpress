import type { PaymentProvider, PaymentRequest, PaymentResult } from './provider';

export class GeniusPaymentProvider implements PaymentProvider {
  readonly name = 'genius';

  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string
  ) {}

  async start(request: PaymentRequest): Promise<PaymentResult> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3210';
    const successUrl = `${siteUrl}/fr/commande/confirmation?order=${encodeURIComponent(request.orderNumber)}`;
    const errorUrl = `${siteUrl}/fr/commande/paiement?error=payment_failed`;

    try {
      const response = await fetch('https://pay.genius.ci/api/v1/merchant/payments', {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'X-API-Secret': this.apiSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: request.amountMinor / 100, // GeniusPay expects major units
          currency: request.currency,
          description: `Reign Order #${request.orderNumber}`,
          success_url: successUrl,
          error_url: errorUrl,
          metadata: {
            orderId: request.orderId,
            orderNumber: request.orderNumber,
            idempotencyKey: request.idempotencyKey,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GeniusPay API error: ${response.status} - ${errorText}`);
      }

      const body = await response.json() as {
        success: boolean;
        data?: {
          id: number | string;
          reference: string;
          checkout_url?: string;
          payment_url?: string;
        };
        error?: {
          code: string;
          message: string;
        };
      };

      if (!body.success || !body.data) {
        throw new Error(body.error?.message || 'Invalid response from GeniusPay API');
      }

      const checkoutUrl = body.data.checkout_url || body.data.payment_url;
      if (!checkoutUrl) {
        throw new Error('No checkout URL returned from GeniusPay API');
      }

      return {
        providerReference: String(body.data.reference),
        providerEventId: `genius_evt_init_${request.idempotencyKey}`,
        status: 'pending',
        payload: {
          checkoutUrl,
          geniusPaymentId: body.data.id,
          rawResponse: body.data,
        },
      };
    } catch (error) {
      console.error('Failed to initiate GeniusPay payment:', error);
      throw error;
    }
  }
}
