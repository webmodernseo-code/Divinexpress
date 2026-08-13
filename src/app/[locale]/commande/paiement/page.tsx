'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { validatePaymentForm, type PaymentFormValues, type PaymentFormErrors } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { readCheckoutResponse } from '@/lib/checkoutResponse';

const PAYMENT_METHODS = ['stripe', 'genius'] as const;

const PAYMENT_LOGOS: Record<(typeof PAYMENT_METHODS)[number], { src: string; width: number; height: number }[]> = {
  stripe: [
    { src: '/payment/visa-mastercard.png', width: 1231, height: 496 },
    { src: '/payment/paypal.png', width: 600, height: 400 }
  ],
  genius: [
    { src: '/payment/visa-mastercard.png', width: 1231, height: 496 },
    { src: '/payment/orange-money.png', width: 3840, height: 1025 },
    { src: '/payment/wave.png', width: 701, height: 437 }
  ]
};

const DEFAULT_VALUES: PaymentFormValues = { method: '' };

type PaymentCapabilities = Record<(typeof PAYMENT_METHODS)[number], { status: 'configured' | 'unavailable' }>;

export default function PaymentPage() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const { shipping } = useCheckout();
  const { items, clearCart } = useCart();
  const [values, setValues] = useState<PaymentFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [capabilities, setCapabilities] = useState<PaymentCapabilities | null>(null);

  useEffect(() => {
    fetch('/api/checkout')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result: { methods: PaymentCapabilities }) => {
        setCapabilities(result.methods);
        const available = PAYMENT_METHODS.find((method) => result.methods[method].status === 'configured');
        setValues({ method: available ?? '' });
      })
      .catch(() => setCapabilities({ stripe: { status: 'unavailable' }, genius: { status: 'unavailable' } }));
  }, []);

  function handleSelect(method: PaymentFormValues['method']) {
    setValues({ method });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validatePaymentForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setSubmitting(true);
      setServerError('');
      try {
        const storageKey = 'divinexpress-checkout-idempotency';
        const idempotencyKey = window.sessionStorage.getItem(storageKey) ?? crypto.randomUUID();
        window.sessionStorage.setItem(storageKey, idempotencyKey);
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ idempotencyKey, method: values.method, shipping, items }),
        });
        const result = await readCheckoutResponse(response);
        window.sessionStorage.removeItem(storageKey);
        clearCart();
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          router.push(`/commande/confirmation?order=${encodeURIComponent(result.orderNumber)}`);
        }
      } catch {
        setServerError(locale === 'fr'
          ? 'Le paiement n’a pas pu être finalisé. Vérifiez votre panier et réessayez.'
          : 'Payment could not be completed. Check your cart and try again.');
      } finally {
        setSubmitting(false);
      }
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
      <p className="mt-2 text-center text-sm text-mist-600">
        {locale === 'fr' ? 'Seuls les moyens de paiement configurés peuvent être sélectionnés.' : 'Only configured payment methods can be selected.'}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-5">
        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => {
            const isActive = values.method === method;
            const isAvailable = capabilities?.[method].status === 'configured';
            return (
              <button
                key={method}
                type="button"
                onClick={() => handleSelect(method)}
                disabled={!isAvailable}
                aria-pressed={isActive}
                className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive ? 'border-ink bg-mist-50' : 'border-mist-100 bg-paper hover:border-accent'
                }`}
              >
                <span>
                  <span className="block text-sm font-bold">{t(`paymentMethods.${method}.name`)}</span>
                  <span className="mt-1 block text-xs text-mist-600">
                    {t(`paymentMethods.${method}.description`)}
                  </span>
                  {!isAvailable && (
                    <span className="mt-1 block text-xs font-medium text-accent">
                      {locale === 'fr' ? 'Indisponible tant que le prestataire n’est pas configuré' : 'Unavailable until the provider is configured'}
                    </span>
                  )}
                  <span className="mt-2 flex items-center gap-2">
                    {PAYMENT_LOGOS[method].map((logo) => (
                      <Image
                        key={logo.src}
                        src={logo.src}
                        alt=""
                        width={logo.width}
                        height={logo.height}
                        className="h-5 w-auto rounded-sm object-contain"
                      />
                    ))}
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
        {serverError && <p role="alert" className="text-sm text-accent">{serverError}</p>}

        <Button type="submit" disabled={submitting || items.length === 0 || !values.method} className="w-full rounded-2xl">
          {submitting ? (locale === 'fr' ? 'TRAITEMENT…' : 'PROCESSING…') : t('confirmPayment')}
        </Button>
      </form>
    </Container>
  );
}
