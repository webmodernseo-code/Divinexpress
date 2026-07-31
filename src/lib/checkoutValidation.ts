export interface ShippingFormValues {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
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
  if (!values.city.trim()) errors.city = 'required';
  if (!values.postalCode.trim()) errors.postalCode = 'required';
  if (!values.country.trim()) errors.country = 'required';

  return errors;
}
