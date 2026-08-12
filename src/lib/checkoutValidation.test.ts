import { describe, expect, it } from 'vitest';
import {
  validateShippingForm,
  validatePaymentForm,
  type ShippingFormValues,
  type PaymentFormValues
} from './checkoutValidation';

const validValues: ShippingFormValues = {
  region: 'europe',
  fullName: 'Alex Martin',
  email: 'alex@example.com',
  address: '12 rue de la Paix',
  city: 'Paris',
  postalCode: '75002',
  country: 'France',
  countryCode: 'FR'
};

describe('validateShippingForm', () => {
  it('returns no errors for fully valid values', () => {
    expect(validateShippingForm(validValues)).toEqual({});
  });

  it('flags a missing full name', () => {
    expect(validateShippingForm({ ...validValues, fullName: '' }).fullName).toBe('required');
  });

  it('flags a missing email', () => {
    expect(validateShippingForm({ ...validValues, email: '' }).email).toBe('required');
  });

  it('flags an invalid email format', () => {
    expect(validateShippingForm({ ...validValues, email: 'not-an-email' }).email).toBe('invalid');
  });

  it('flags each other missing field independently', () => {
    expect(validateShippingForm({ ...validValues, address: '' }).address).toBe('required');
    expect(validateShippingForm({ ...validValues, city: '' }).city).toBe('required');
    expect(validateShippingForm({ ...validValues, postalCode: '' }).postalCode).toBe('required');
    expect(validateShippingForm({ ...validValues, country: '' }).country).toBe('required');
    expect(validateShippingForm({ ...validValues, countryCode: '' }).country).toBe('required');
  });

  it('europe requires city and postalCode', () => {
    expect(validateShippingForm({ ...validValues, city: '', postalCode: '' })).toEqual({
      city: 'required',
      postalCode: 'required'
    });
  });

  it('africa requires phone but not city/postalCode', () => {
    const africa: ShippingFormValues = {
      ...validValues,
      region: 'africa',
      country: 'Sénégal',
      countryCode: 'SN',
      city: '',
      postalCode: '',
      phone: ''
    };
    expect(validateShippingForm(africa)).toEqual({ phone: 'required' });
  });

  it('africa passes with phone set', () => {
    const africa: ShippingFormValues = {
      ...validValues,
      region: 'africa',
      countryCode: 'SN',
      city: '',
      postalCode: '',
      phone: '+221770000000'
    };
    expect(validateShippingForm(africa)).toEqual({});
  });
});

describe('validatePaymentForm', () => {
  it('returns no errors when method is stripe', () => {
    expect(validatePaymentForm({ method: 'stripe' })).toEqual({});
  });

  it('returns no errors when method is genius', () => {
    expect(validatePaymentForm({ method: 'genius' })).toEqual({});
  });

  it('flags a missing method', () => {
    const values: PaymentFormValues = { method: '' };
    expect(validatePaymentForm(values)).toEqual({ method: 'required' });
  });
});
