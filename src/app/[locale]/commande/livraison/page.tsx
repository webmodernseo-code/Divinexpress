'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/context/CheckoutContext';
import { validateShippingForm, type ShippingFormErrors, type ShippingFormValues } from '@/lib/checkoutValidation';
import { EUROPE, AFRICA, countryName } from '@/lib/countries';
import { AddressAutocomplete } from '@/components/checkout/AddressAutocomplete';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';

const EMPTY_VALUES: ShippingFormValues = {
  region: 'europe',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'France',
  countryCode: 'FR'
};

export default function ShippingPage() {
  const t = useTranslations('checkout');
  const rawLocale = useLocale();
  const locale: 'fr' | 'en' = rawLocale === 'en' ? 'en' : 'fr';
  const router = useRouter();
  const { items } = useCart();
  const { shipping, setShipping } = useCheckout();
  const [values, setValues] = useState<ShippingFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ShippingFormErrors>({});

  useEffect(() => {
    // Merge over defaults so data saved before this field set stays valid.
    if (shipping) setValues({ ...EMPTY_VALUES, ...shipping });
  }, [shipping]);

  function update<K extends keyof ShippingFormValues>(key: K, value: ShippingFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function switchRegion(region: 'europe' | 'africa') {
    setValues((current) => {
      if (current.region === region) return current;
      if (region === 'africa') {
        return { ...current, region, city: '', postalCode: '', country: 'Sénégal', countryCode: 'SN' };
      }
      return { ...current, region, phone: '', country: 'France', countryCode: 'FR' };
    });
    setErrors({});
  }

  function selectCountry(code: string) {
    setValues((current) => ({ ...current, countryCode: code, country: countryName(code, locale) }));
  }

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

  const inputClass = 'h-12 w-full rounded-xl border border-mist-200 bg-paper px-4 text-sm outline-none focus:border-ink';
  const countries = values.region === 'africa' ? AFRICA : EUROPE;

  function TextField({
    field,
    type = 'text',
    autoComplete,
    fullWidth
  }: {
    field: keyof ShippingFormValues;
    type?: string;
    autoComplete?: string;
    fullWidth?: boolean;
  }) {
    return (
      <label className={fullWidth ? 'sm:col-span-2' : undefined}>
        <span className="mb-2 block text-sm font-medium">{t(`fields.${field}`)}</span>
        <input
          type={type}
          autoComplete={autoComplete}
          value={(values[field] as string) ?? ''}
          aria-invalid={Boolean(errors[field])}
          aria-describedby={errors[field] ? `${field}-error` : undefined}
          onChange={(event) => update(field, event.target.value as ShippingFormValues[typeof field])}
          className={inputClass}
        />
        {errors[field] && (
          <span id={`${field}-error`} className="mt-1 block text-xs text-accent">{t(`errors.${errors[field]}`)}</span>
        )}
      </label>
    );
  }

  const countrySelect = (
    <label>
      <span className="mb-2 block text-sm font-medium">{t('fields.country')}</span>
      <select
        value={values.countryCode}
        autoComplete="country"
        aria-invalid={Boolean(errors.country)}
        onChange={(event) => selectCountry(event.target.value)}
        className={inputClass}
      >
        {countries.map((c) => (
          <option key={c.code} value={c.code}>{countryName(c.code, locale)}</option>
        ))}
      </select>
      {errors.country && (
        <span className="mt-1 block text-xs text-accent">{t(`errors.${errors.country}`)}</span>
      )}
    </label>
  );

  return (
    <Container className="max-w-2xl py-12">
      <CheckoutSteps current={1} />
      <Heading level={1} className="text-center">{t('shippingTitle')}</Heading>

      <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-6">
        <div>
          <span className="mb-2 block text-sm font-medium">{t('regionLabel')}</span>
          <div className="inline-flex rounded-full border border-mist-200 p-1">
            {(['europe', 'africa'] as const).map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => switchRegion(region)}
                aria-pressed={values.region === region}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors ${
                  values.region === region ? 'bg-ink text-paper' : 'text-ink hover:text-accent'
                }`}
              >
                {t(region === 'europe' ? 'regionEurope' : 'regionAfrica')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField field="fullName" autoComplete="name" fullWidth />
          <TextField field="email" type="email" autoComplete="email" fullWidth />

          {values.region === 'europe' ? (
            <>
              <div className="sm:col-span-2">
                <AddressAutocomplete
                  value={values.address}
                  locale={locale}
                  label={t('fields.address')}
                  hint={t('addressHint')}
                  attribution={t('osmAttribution')}
                  error={errors.address ? t(`errors.${errors.address}`) : undefined}
                  onInputChange={(text) => update('address', text)}
                  onSelect={(sel) =>
                    setValues((current) => ({
                      ...current,
                      address: sel.address,
                      city: sel.city,
                      postalCode: sel.postalCode,
                      country: sel.country || current.country,
                      countryCode: sel.countryCode || current.countryCode
                    }))
                  }
                />
              </div>
              <TextField field="city" autoComplete="address-level2" />
              <TextField field="postalCode" autoComplete="postal-code" />
              {countrySelect}
            </>
          ) : (
            <>
              <TextField field="phone" type="tel" autoComplete="tel" />
              {countrySelect}
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium">{t('fields.address')}</span>
                <textarea
                  value={values.address}
                  rows={3}
                  placeholder={t('africaAddressPlaceholder')}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={errors.address ? 'address-error' : undefined}
                  onChange={(event) => update('address', event.target.value)}
                  className="w-full rounded-xl border border-mist-200 bg-paper px-4 py-3 text-sm outline-none focus:border-ink"
                />
                {errors.address && (
                  <span id="address-error" className="mt-1 block text-xs text-accent">{t(`errors.${errors.address}`)}</span>
                )}
              </label>
            </>
          )}
        </div>

        <Button type="submit" className="w-full rounded-2xl">{t('continueToPayment')}</Button>
      </form>
    </Container>
  );
}
