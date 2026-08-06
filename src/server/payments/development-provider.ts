import { createHash } from 'node:crypto';
import type { PaymentProvider, PaymentRequest, PaymentResult } from './provider';

export class DevelopmentPaymentProvider implements PaymentProvider {
  readonly name = 'development';

  constructor(private readonly outcome: 'succeed' | 'fail' = 'succeed') {}

  async start(request: PaymentRequest): Promise<PaymentResult> {
    const fingerprint = createHash('sha256').update(request.idempotencyKey).digest('hex').slice(0, 20);
    const status = this.outcome === 'succeed' ? 'paid' : 'failed';
    return {
      providerReference: `dev_pay_${fingerprint}`,
      providerEventId: `dev_evt_${fingerprint}_${status}`,
      status,
      payload: { simulated: true, outcome: this.outcome },
    };
  }
}
