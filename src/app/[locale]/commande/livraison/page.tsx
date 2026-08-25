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
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { DeliveryRegionSelector, type DeliveryRegion } from '@/components/checkout/DeliveryRegionSelector';

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

const INPUT_CLASS = 'h-12 w-full rounded-xl border border-mist-200 bg-paper px-4 text-sm outline-none focus:border-ink';

type ShippingTextFieldProps = {
  field: keyof ShippingFormValues;
  value: string;
  label: string;
  errorMessage?: string;
  type?: string;
  autoComplete?: string;
  fullWidth?: boolean;
  onChange: (value: string) => void;
};

function ShippingTextField({
  field,
  value,
  label,
  errorMessage,
  type = 'text',
  autoComplete,
  fullWidth,
  onChange
}: ShippingTextFieldProps) {
  return (
    <label className={fullWidth ? 'sm:col-span-2' : undefined}>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? `${field}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      />
      {errorMessage && (
        <span id={`${field}-error`} className="mt-1 block text-xs text-accent">{errorMessage}</span>
      )}
    </label>
  );
}

export default function ShippingPage() {
  const t = useTranslations('checkout');
  const rawLocale = useLocale();
  const locale: 'fr' | 'en' = rawLocale === 'en' ? 'en' : 'fr';
  const router = useRouter();
  const { items, subtotalEur } = useCart();
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

  function switchRegion(region: DeliveryRegion) {
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

  const countries = values.region === 'africa' ? AFRICA : EUROPE;

  const countrySelect = (
    <label>
      <span className="mb-2 block text-sm font-medium">{t('fields.country')}</span>
      <select
        value={values.countryCode}
        autoComplete="country"
        aria-invalid={Boolean(errors.country)}
        onChange={(event) => selectCountry(event.target.value)}
        className={INPUT_CLASS}
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
    <Container className="max-w-6xl py-12">
      <CheckoutSteps current={1} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <main>
          <Heading level={1} className="text-center">{t('shippingTitle')}</Heading>

          <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-6">
        <div>
          <span className="mb-2 block text-sm font-medium">{t('regionLabel')}</span>
          <DeliveryRegionSelector
            value={values.region}
            onChange={switchRegion}
            groupLabel={t('regionLabel')}
            europeLabel={t('regionEurope')}
            africaLabel={t('regionAfrica')}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ShippingTextField field="fullName" value={values.fullName} label={t('fields.fullName')} errorMessage={errors.fullName ? t(`errors.${errors.fullName}`) : undefined} autoComplete="name" fullWidth onChange={(value) => update('fullName', value)} />
          <ShippingTextField field="email" value={values.email} label={t('fields.email')} errorMessage={errors.email ? t(`errors.${errors.email}`) : undefined} type="email" autoComplete="email" fullWidth onChange={(value) => update('email', value)} />

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
              <ShippingTextField field="city" value={values.city ?? ''} label={t('fields.city')} errorMessage={errors.city ? t(`errors.${errors.city}`) : undefined} autoComplete="address-level2" onChange={(value) => update('city', value)} />
              <ShippingTextField field="postalCode" value={values.postalCode ?? ''} label={t('fields.postalCode')} errorMessage={errors.postalCode ? t(`errors.${errors.postalCode}`) : undefined} autoComplete="postal-code" onChange={(value) => update('postalCode', value)} />
              {countrySelect}
            </>
          ) : (
            <>
              <ShippingTextField field="phone" value={values.phone ?? ''} label={t('fields.phone')} errorMessage={errors.phone ? t(`errors.${errors.phone}`) : undefined} type="tel" autoComplete="tel" onChange={(value) => update('phone', value)} />
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
        </main>

        <aside className="lg:sticky lg:top-28">
          <OrderSummary items={items} subtotalEur={subtotalEur} />
        </aside>
      </div>
    </Container>
  );
}
