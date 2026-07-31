import { describe, expect, it } from 'vitest';
import {
  validateShippingForm,
  validatePaymentForm,
  type ShippingFormValues,
  type PaymentFormValues
} from './checkoutValidation';

const validValues: ShippingFormValues = {
  fullName: 'Alex Martin',
  email: 'alex@example.com',
  address: '12 rue de la Paix',
  city: 'Paris',
  postalCode: '75002',
  country: 'France'
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
