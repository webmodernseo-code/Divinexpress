import { describe, expect, it } from 'vitest';
import { validateContactForm, type ContactFormValues } from './contactValidation';

const validValues: ContactFormValues = {
  name: 'Alex Martin',
  email: 'alex@example.com',
  message: "Bonjour, j'aimerais des informations sur une commande."
};

describe('validateContactForm', () => {
  it('returns no errors for fully valid values', () => {
    expect(validateContactForm(validValues)).toEqual({});
  });

  it('flags a missing name', () => {
    expect(validateContactForm({ ...validValues, name: '' }).name).toBe('required');
  });

  it('flags a missing email', () => {
    expect(validateContactForm({ ...validValues, email: '' }).email).toBe('required');
  });

  it('flags an invalid email format', () => {
    expect(validateContactForm({ ...validValues, email: 'nope' }).email).toBe('invalid');
  });

  it('flags a missing message', () => {
    expect(validateContactForm({ ...validValues, message: '' }).message).toBe('required');
  });

  it('flags a message that is too short', () => {
    expect(validateContactForm({ ...validValues, message: 'hi' }).message).toBe('tooShort');
  });
});
