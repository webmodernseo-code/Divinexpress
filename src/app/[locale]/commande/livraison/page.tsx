'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useCheckout } from '@/context/CheckoutContext';
import { validateShippingForm, type ShippingFormValues, type ShippingFormErrors } from '@/lib/checkoutValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';

const EMPTY_VALUES: ShippingFormValues = {
  fullName: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  country: ''
};

export default function ShippingPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { shipping, setShipping } = useCheckout();
  const [values, setValues] = useState<ShippingFormValues>(shipping ?? EMPTY_VALUES);
  const [errors, setErrors] = useState<ShippingFormErrors>({});

  // CheckoutProvider loads `shipping` from sessionStorage in its own effect, which runs
  // after this component's initial render. On a fresh mount (e.g. a hard refresh, or the
  // 404 full-navigation before Task 20 exists) that value isn't ready yet when the
  // `useState` initializer above runs, so it captures EMPTY_VALUES. Re-sync once the
  // context value resolves; this is a no-op once `values` already matches.
  useEffect(() => {
    if (shipping) setValues(shipping);
  }, [shipping]);

  function handleChange(field: keyof ShippingFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateShippingForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setShipping(values);
      router.push('/commande/paiement');
    }
  }

  function renderField(name: keyof ShippingFormValues) {
    return (
      <div key={name}>
        <label htmlFor={name} className="mb-2 block text-xs font-bold tracking-wide">
          {t(`fields.${name}`)}
        </label>
        <input
          id={name}
          type={name === 'email' ? 'email' : 'text'}
          value={values[name]}
          onChange={(event) => handleChange(name, event.target.value)}
          className="block w-full rounded-2xl border border-mist-100 bg-paper px-4 py-3.5 text-sm transition-colors focus:border-accent focus:outline-none"
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
        {errors[name] && (
          <p id={`${name}-error`} className="mt-1.5 text-xs text-accent">
            {t(`errors.${errors[name]}`)}
          </p>
        )}
      </div>
    );
  }

  return (
    <Container className="max-w-xl py-12">
      <CheckoutSteps current={1} />

      <Heading level={1} className="text-center">
        {t('shippingTitle')}
      </Heading>

      <div className="mt-4 flex items-center justify-center gap-2.5 rounded-2xl bg-mist-50 px-[18px] py-3 text-center text-[13px] text-mist-600">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
          className="h-4 w-4 flex-shrink-0 text-accent"
        >
          <path d="M12 21s-7.5-4.6-10-9.1C.5 8.7 2 5 5.6 5c1.6 0 3 .7 4.2 1.8" />
          <path d="M13 3l8 8-8 8" />
          <path d="M21 11H9" />
        </svg>
        <span>{t('guestNotice')}</span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-5">
        {renderField('fullName')}
        {renderField('email')}
        {renderField('address')}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
          {renderField('city')}
          {renderField('postalCode')}
        </div>

        {renderField('country')}

        <Button type="submit" className="w-full rounded-2xl">
          {t('continueToPayment')}
        </Button>
      </form>
    </Container>
  );
}
