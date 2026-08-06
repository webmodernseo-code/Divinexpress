export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled';

export interface PaymentRequest {
  orderId: string;
  orderNumber: string;
  amountMinor: number;
  currency: 'EUR' | 'GBP';
  idempotencyKey: string;
}

export interface PaymentResult {
  providerReference: string;
  providerEventId: string;
  status: PaymentStatus;
  payload: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  start(request: PaymentRequest): Promise<PaymentResult>;
}
