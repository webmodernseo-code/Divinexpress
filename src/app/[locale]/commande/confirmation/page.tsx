'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCheckout } from '@/context/CheckoutContext';
import type { ShippingFormValues } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';

export default function ConfirmationPage() {
  const t = useTranslations('checkout');
  const { shipping, clearShipping } = useCheckout();
  const [orderNumber] = useState(() => `RG-${Date.now().toString(36).toUpperCase()}`);
  const [confirmedShipping, setConfirmedShipping] = useState<ShippingFormValues | null>(null);
  const hasCaptured = useRef(false);

  // CheckoutProvider hydrates `shipping` from sessionStorage in its own effect, which runs
  // after this component's initial render — a `useState(shipping)` initializer would freeze
  // on the pre-hydration `null` value and never show the real confirmation. Capturing via an
  // effect (once `shipping` becomes available) lets us render correctly once it resolves, and
  // `hasCaptured` guards against re-capturing after `clearShipping()` sets it back to null.
  useEffect(() => {
    if (shipping && !hasCaptured.current) {
      hasCaptured.current = true;
      setConfirmedShipping(shipping);
      clearShipping();
    }
  }, [shipping, clearShipping]);

  if (!confirmedShipping) {
    return (
      <Container className="max-w-xl py-12 text-center">
        <CheckoutSteps current={3} />
        <Heading level={1}>{t('confirmationTitle')}</Heading>
        <p className="mt-4 text-sm text-mist-600">{t('noOrder')}</p>
        <Link href="/" className="mt-6 inline-block">
          <Button className="rounded-2xl">{t('backHome')}</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-xl py-12 text-center">
      <CheckoutSteps current={3} />

      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-8 w-8 text-paper"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>

      <Heading level={1} className="mt-6">
        {t('confirmationTitle')}
      </Heading>
      <p className="mt-4 text-sm text-mist-600">{t('thankYou', { orderNumber })}</p>
      <div className="mt-8 rounded-2xl border border-mist-200 p-6 text-left text-sm">
        <p className="font-medium">{confirmedShipping.fullName}</p>
        <p>{confirmedShipping.address}</p>
        <p>
          {confirmedShipping.postalCode} {confirmedShipping.city}
        </p>
        <p>{confirmedShipping.country}</p>
      </div>
      <Link href="/" className="mt-8 inline-block">
        <Button className="rounded-2xl">{t('backHome')}</Button>
      </Link>
    </Container>
  );
}
