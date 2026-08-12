export interface ShippingFormValues {
  region: 'europe' | 'africa';
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city?: string;
  postalCode?: string;
  country: string;
  countryCode: string;
}

export type ShippingFormErrors = Partial<Record<keyof ShippingFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateShippingForm(values: ShippingFormValues): ShippingFormErrors {
  const errors: ShippingFormErrors = {};

  if (!values.fullName.trim()) errors.fullName = 'required';

  if (!values.email.trim()) {
    errors.email = 'required';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'invalid';
  }

  if (!values.address.trim()) errors.address = 'required';
  if (!values.country.trim() || !values.countryCode.trim()) errors.country = 'required';

  if (values.region === 'africa') {
    // Africa: a precise free-text address + phone; no city/postal code.
    if (!values.phone?.trim()) errors.phone = 'required';
  } else {
    // Europe: structured address with city and postal code.
    if (!values.city?.trim()) errors.city = 'required';
    if (!values.postalCode?.trim()) errors.postalCode = 'required';
  }

  return errors;
}

export interface PaymentFormValues {
  method: 'stripe' | 'genius' | '';
}

export type PaymentFormErrors = Partial<Record<keyof PaymentFormValues, string>>;

export function validatePaymentForm(values: PaymentFormValues): PaymentFormErrors {
  const errors: PaymentFormErrors = {};
  if (values.method !== 'stripe' && values.method !== 'genius') {
    errors.method = 'required';
  }
  return errors;
}
