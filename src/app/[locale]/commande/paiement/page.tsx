'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { validatePaymentForm, type PaymentFormValues, type PaymentFormErrors } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';

const PAYMENT_METHODS = ['stripe', 'genius'] as const;

const DEFAULT_VALUES: PaymentFormValues = { method: 'stripe' };

export default function PaymentPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { shipping } = useCheckout();
  const { clearCart } = useCart();
  const [values, setValues] = useState<PaymentFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<PaymentFormErrors>({});

  function handleSelect(method: PaymentFormValues['method']) {
    setValues({ method });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validatePaymentForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      clearCart();
      router.push('/commande/confirmation');
    }
  }

  if (!shipping) {
    return (
      <Container className="max-w-xl py-12">
        <CheckoutSteps current={2} />
        <Heading level={1} className="text-center">
          {t('paymentTitle')}
        </Heading>
        <p className="mt-4 text-center text-sm text-mist-600">{t('missingShipping')}</p>
        <Link href="/commande/livraison" className="mt-6 flex justify-center">
          <Button className="rounded-2xl">{t('backToShipping')}</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-xl py-12">
      <CheckoutSteps current={2} />

      <Heading level={1} className="text-center">
        {t('paymentTitle')}
      </Heading>
      <p className="mt-2 text-center text-sm text-mist-600">{t('mockNotice')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-5">
        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => {
            const isActive = values.method === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => handleSelect(method)}
                aria-pressed={isActive}
                className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors ${
                  isActive ? 'border-ink bg-mist-50' : 'border-mist-100 bg-paper hover:border-accent'
                }`}
              >
                <span>
                  <span className="block text-sm font-bold">{t(`paymentMethods.${method}.name`)}</span>
                  <span className="mt-1 block text-xs text-mist-600">
                    {t(`paymentMethods.${method}.description`)}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isActive ? 'border-ink bg-ink' : 'border-mist-300 bg-paper'
                  }`}
                >
                  {isActive && <span className="h-2 w-2 rounded-full bg-paper" />}
                </span>
              </button>
            );
          })}
        </div>
        {errors.method && <p className="text-xs text-accent">{t(`errors.${errors.method}`)}</p>}

        <Button type="submit" className="w-full rounded-2xl">
          {t('confirmPayment')}
        </Button>
      </form>
    </Container>
  );
}
