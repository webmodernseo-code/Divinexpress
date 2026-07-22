const XOF_PER_EUR = 655.957;

export function eurCentsToXof(amountCents: number): number {
  return Math.round((amountCents / 100) * XOF_PER_EUR);
}

export type InitiatePaymentInput = {
  amountXof: number;
  description: string;
  customer: { email?: string; name?: string; phone?: string };
  successUrl: string;
  errorUrl: string;
  metadata: Record<string, string>;
};

export type InitiatePaymentResult = {
  reference: string;
  checkoutUrl: string;
};

export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
  const response = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.GENIUSPAY_PUBLIC_KEY ?? '',
      'X-API-Secret': process.env.GENIUSPAY_SECRET_KEY ?? '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: input.amountXof,
      currency: 'XOF',
      description: input.description,
      customer: input.customer,
      success_url: input.successUrl,
      error_url: input.errorUrl,
      metadata: input.metadata
    })
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json?.error?.message ?? 'GeniusPay payment initiation failed');
  }

  return {
    reference: json.data.reference,
    checkoutUrl: json.data.checkout_url ?? json.data.payment_url
  };
}
