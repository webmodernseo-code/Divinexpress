'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { validateShippingForm, type ShippingFormErrors, type ShippingFormValues } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';

const EMPTY_VALUES: ShippingFormValues = {
  fullName: '', email: '', address: '', city: '', postalCode: '', country: 'France',
};

const FIELDS: Array<{ key: keyof ShippingFormValues; type?: string; autoComplete: string }> = [
  { key: 'fullName', autoComplete: 'name' },
  { key: 'email', type: 'email', autoComplete: 'email' },
  { key: 'address', autoComplete: 'street-address' },
  { key: 'city', autoComplete: 'address-level2' },
  { key: 'postalCode', autoComplete: 'postal-code' },
  { key: 'country', autoComplete: 'country-name' },
];

export default function ShippingPage() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const { items } = useCart();
  const { shipping, setShipping } = useCheckout();
  const [values, setValues] = useState<ShippingFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ShippingFormErrors>({});

  useEffect(() => {
    if (shipping) setValues(shipping);
  }, [shipping]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateShippingForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setShipping(values);
    router.push('/commande/paiement');
  }

  if (items.length === 0) {
    return (
      <Container className="max-w-xl py-12 text-center">
        <CheckoutSteps current={1} />
        <Heading level={1}>{locale === 'fr' ? 'Votre panier est vide' : 'Your basket is empty'}</Heading>
        <Link href="/" className="mt-6 inline-block">
          <Button>{locale === 'fr' ? 'Retour à la boutique' : 'Back to shop'}</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl py-12">
      <CheckoutSteps current={1} />
      <Heading level={1} className="text-center">{t('shippingTitle')}</Heading>
      <form onSubmit={handleSubmit} noValidate className="mt-9 grid gap-5 sm:grid-cols-2">
        {FIELDS.map(({ key, type = 'text', autoComplete }) => (
          <label key={key} className={key === 'address' ? 'sm:col-span-2' : undefined}>
            <span className="mb-2 block text-sm font-medium">{t(`fields.${key}`)}</span>
            <input
              type={type}
              autoComplete={autoComplete}
              value={values[key]}
              aria-invalid={Boolean(errors[key])}
              aria-describedby={errors[key] ? `${key}-error` : undefined}
              onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
              className="h-12 w-full rounded-xl border border-mist-200 bg-paper px-4 text-sm outline-none focus:border-ink"
            />
            {errors[key] && (
              <span id={`${key}-error`} className="mt-1 block text-xs text-accent">{t(`errors.${errors[key]}`)}</span>
            )}
          </label>
        ))}
        <Button type="submit" className="w-full rounded-2xl sm:col-span-2">{t('continueToPayment')}</Button>
      </form>
    </Container>
  );
}
